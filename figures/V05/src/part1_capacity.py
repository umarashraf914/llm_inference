"""V5 Part 1, why one chip is not enough: Figs 1-5 rebuilt, N1 and N2 of plans/depth_pass/V05_review.md.

  python3 figures/V05/src/part1_capacity.py     writes items o001-o005, n1, n2
"""
import math
from v05common import *  # noqa: F401,F403


# ---- Fig 1: the weights do not fit ---------------------------------------------------------------
def o001():
    fp8 = DS_PARAMS * 1                                  # FP8: one byte per parameter
    one_bit = DS_PARAMS / 8                              # eight parameters to a byte
    assert fp8 == 1.6e12 and one_bit == 200e9
    r_b200, r_h100 = fp8 / B200_MEM, fp8 / H100_MEM
    assert round(r_b200, 2) == 8.33 and r_h100 == 20
    over = one_bit - B200_MEM
    assert over == 8e9
    X0, SC = 200, 400 / 1600                             # px per GB, top panel
    b = []
    rows = [("DeepSeek V4 Pro, FP8", fp8, "h"), ("one B200 holds", B200_MEM, "s"),
            ("one H100 holds", H100_MEM, "s")]
    for k, (lab, v, c) in enumerate(rows):
        y = 50 + k * 44
        w = v / 1e9 * SC
        b.append(txt(40, y + 19, lab, "cap"))
        if k == 0:
            b.append(cell(X0, y, w, 28, c, label="1.6 trillion parameters × 1 byte = 1.6 TB"))
        else:
            b.append(cell(X0, y, w, 28, c))
            b.append(txt(X0 + w + 10, y + 19, f"{v / 1e9:.0f} GB", "sub2"))
    b.append(hd(40, 204, "Even at one bit per parameter, the weights overflow one B200"))
    S2 = 1.8                                             # px per GB, lower panel: drawn larger
    for k, (lab, v, c) in enumerate([("1 bit per parameter", one_bit, "h"), ("one B200", B200_MEM, "s")]):
        y = 222 + k * 40
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(X0, y, v / 1e9 * S2, 28, c, label=f"{v / 1e9:.0f} GB"))
    edge = X0 + B200_MEM / 1e9 * S2
    b.append(mark(edge, 214, edge, 298))
    b.append(txt(X0 + one_bit / 1e9 * S2 + 10, 241, f"{over / 1e9:.0f} GB over", "sub2"))
    body, yb = prose(340, [
        f"DeepSeek V4 Pro has 1.6 trillion parameters. Stored in FP8, one byte each ({{{{fig:v04-o032}}}}), "
        f"that is 1.6 terabytes of weights. A high-end Nvidia B200 holds 192 GB: 1,600 ÷ 192 = "
        f"{f(r_b200, 1)}, so the weights alone are eight times too big for one chip, and "
        f"1,600 ÷ 80 = {r_h100:.0f} times too big for an 80 GB H100.",
        "Quantization cannot close this gap. Shrink every parameter to a single bit and 1.6 trillion "
        f"bits ÷ 8 bits per byte ({{{{fig:v01-o073}}}}) is still {one_bit / 1e9:.0f} GB, "
        f"{over / 1e9:.0f} GB more than the B200 holds.",
        "So the model has to be split across many GPUs, and the moment it is, a problem appears "
        "that a single chip never had.",
    ])
    emit("o001", stamp(SRT, "The Frontier model DeepSeek V4 Pro"),
         "The weights alone are eight times one chip", yb + 26, b + [body],
         "Bars to scale; the lower pair is drawn larger. This is a capacity wall, not the speed wall "
         "of V1: no amount of bandwidth helps when the weights do not fit "
         "({{ref:v02-o091}}).")


# ---- Fig 2: node and cluster ---------------------------------------------------------------------
def o002():
    b = [cont(40, 40, 285, 160, "u", "One server, or node")]
    for r in range(2):
        for c in range(4):
            b.append(cell(62 + c * 60, 96 + r * 46, 52, 38, "m"))
    b.append(txt(62, 218, "eight GPUs in one metal box", "sub2"))
    b.append(cont(368, 40, 272, 160, "u", "A cluster"))
    b.append(box(390, 96, 110, 78, "u", "node A", rx=4).replace('class="lbl"', 'class="sub"'))
    b.append(box(510, 96, 110, 78, "u", "node B", rx=4).replace('class="lbl"', 'class="sub"'))
    b.append(txt(390, 218, "many boxes, joined by network cable", "sub2"))
    body, yb = prose(268, [
        "Inside one server, a node, the GPUs, typically eight, talk to each other through switch "
        "chips on the same board ({{fig:v02-o093}}). Between servers they talk over ordinary "
        "data-centre networking.",
        "A cluster is many such boxes on one network. How many boxes one model needs, and which "
        "conversations then have to leave a box, is what the rest of this part works out.",
    ])
    emit("o002", stamp(SRT, "The model has to be split across many"),
         "A node is one box of GPUs; a cluster is many boxes", yb + 22, b + [body],
         "The node, not the GPU, is the unit the network sees. Every strategy that follows is "
         "placed on one side of that boundary or the other.")


# ---- N1: not even a full node --------------------------------------------------------------------
def n1():
    fp8 = DS_PARAMS
    node_b200, node_h100 = 8 * B200_MEM, 8 * H100_MEM
    need = math.ceil(fp8 / B200_MEM)
    assert node_b200 == 1536e9 < fp8 and DGX_B200_MEM < fp8 and need == 9
    assert fp8 / H100_MEM == 20 and math.ceil(20 / 8) == 3
    fp4_gpus = math.ceil(DS_FP4_RELEASE_BYTES / B200_MEM)
    assert fp4_gpus == 5 and DS_FP4_RELEASE_BYTES < DGX_B200_MEM
    X0, SC = 230, 400 / 1600
    rows = [("the weights, FP8", fp8, "h", "1,600 GB"),
            ("eight B200s, one node", node_b200, "s", "8 × 192 = 1,536 GB"),
            ("DGX B200, as sold", DGX_B200_MEM, "s", "1,440 GB"),
            ("eight H100s, one node", node_h100, "s", "8 × 80 = 640 GB"),
            ("one B200", B200_MEM, "s", None)]
    b = [hd(40, 40, "Gigabytes, every bar on one scale")]
    for k, (lab, v, c, inside) in enumerate(rows):
        y = 58 + k * 38
        w = v / 1e9 * SC
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, w, 26, c, label=inside))
        if inside is None:
            b.append(txt(X0 + w + 10, y + 18, "192 GB", "sub2"))
    b.append(hd(40, 278, f"At least {need} B200s, and a node holds 8"))
    TW, TG, TX = 52, 6, 40
    b.append(ghost(TX - 8, 292, 8 * TW + 7 * TG + 16, 58))
    for k in range(need):
        x = TX + k * (TW + TG) + (24 if k == 8 else 0)
        b.append(cell(x, 300, TW, 42, "s", label=f"B200 {k + 1}"))
    b.append(txt(TX - 8, 368, "one node: eight GPUs on fast links", "sub2"))
    b.append(txt(TX + 8 * (TW + TG) + 24, 368, "a second box", "sub2"))
    words = {9: "Nine"}
    body, yb = prose(412, [
        f"1,600 ÷ 192 = {f(fp8 / B200_MEM, 2)}, and a GPU cannot be fractional, so at least "
        f"{need} B200s: one more than a node holds. With H100s, 1,600 ÷ 80 = 20, which is three "
        "nodes. Nvidia's eight-GPU DGX B200 lists 1,440 GB, 180 GB a GPU, which falls further short.",
        f"{words[need]} is a floor, not a plan: it leaves nothing for the cache or the working "
        "numbers. And it means that at FP8 some traffic must cross the slow network between boxes "
        "before a single token of cache is counted.",
        f"DeepSeek also publishes the model with its experts in four bits, "
        f"{DS_FP4_RELEASE_BYTES / 1e12:.2f} TB. That fits one eight-B200 node, but still needs at "
        f"least {fp4_gpus} GPUs.",
    ])
    emit("n1", stamp(SRT, "The model has to be split across many"),
         "At FP8, not even a full eight-GPU node holds the weights", yb + 26, b + [body],
         "Bars to scale. For communication the unit that matters is the node, not the chip, because "
         "the fast wiring stops at the edge of the box.")


# ---- Fig 3: four ways to cut, one way to copy ----------------------------------------------------
def o003():
    b = [hd(40, 40, "Each dashed line is a cut, and every cut is a place GPUs must talk")]
    PX, PW = [40, 253, 466], 174
    PY = [62, 222]
    titles = ["by layers: pipeline", "inside every matrix: tensor", "between experts: expert",
              "along the tokens: sequence", "whole copies: data"]
    for k, t in enumerate(titles):
        x, y = PX[k % 3], PY[k // 3]
        b.append(txt(x, y + 12, t, "cap"))
    BW, BH = 150, 18
    # pipeline: four layer groups, cut between the second and third
    x, y = PX[0] + 12, PY[0] + 26
    labs = ["G1 · layers 1–20", "G1 · layers 21–40", "G2 · layers 41–60", "G2 · layers 61–80"]
    for i, lab in enumerate(labs):
        b.append(cell(x, y + i * 24, BW, BH, "u", label=lab))
    b.append(mark(PX[0], y + 2 * 24 - 3, PX[0] + PW, y + 2 * 24 - 3, ok=False))
    # tensor: every layer cut down the middle
    x, y = PX[1] + 12, PY[0] + 26
    HW = (BW - 8) / 2
    for i in range(4):
        b.append(cell(x, y + i * 24, HW, BH, "u", label="G1"))
        b.append(cell(x + HW + 8, y + i * 24, HW, BH, "u", label="G2"))
    b.append(mark(x + HW + 4, y - 6, x + HW + 4, y + 3 * 24 + BH + 6, ok=False))
    # expert: attention whole, the experts divided
    x, y = PX[2] + 12, PY[0] + 26
    b.append(cell(x, y, BW, BH, "u", label="attention, on both"))
    EW, EG, MID = 15, 3, 9
    ex = []
    for i in range(8):
        xx = x + i * (EW + EG) + (MID if i >= 4 else 0)
        ex.append(xx)
        b.append(cell(xx, y + 30, EW, 28, "m"))
    cut = ex[3] + EW + (MID + EG) / 2
    b.append(mark(cut, y + 24, cut, y + 64, ok=False))
    b.append(txt(x, y + 80, "experts 1–4 on G1, 5–8 on G2", "sub2"))
    # sequence: the model on both, the tokens divided
    x, y = PX[0] + 12, PY[1] + 26
    b.append(cell(x, y, BW, BH, "u", label="the model, on both"))
    TW_, TG_ = 15, 3
    tx = []
    for i in range(8):
        xx = x + i * (TW_ + TG_) + (MID if i >= 4 else 0)
        tx.append(xx)
        b.append(cell(xx, y + 30, TW_, 28, "s"))
    cut = tx[3] + TW_ + (MID + TG_) / 2
    b.append(mark(cut, y + 24, cut, y + 64, ok=False))
    b.append(txt(x, y + 80, "tokens 1–4 on G1, 5–8 on G2", "sub2"))
    # data: two whole copies, no cut
    x, y = PX[1] + 12, PY[1] + 26
    CW = (BW - 10) / 2
    for i in range(4):
        b.append(cell(x, y + i * 16, CW, 12, "u"))
        b.append(cell(x + CW + 10, y + i * 16, CW, 12, "u"))
    b.append(txt(x, y + 80, "a copy on G1, a copy on G2", "sub2"))
    # key, in the sixth slot
    x, y = PX[2], PY[1]
    b.append(mark(x, y + 30, x + 34, y + 30, ok=False))
    b.append(txt(x + 44, y + 34, "a cut: data must cross it", "sub2"))
    b.append(txt(x, y + 62, "G1, G2: two GPUs", "sub2"))
    b.append(txt(x, y + 82, "a shard: the piece one GPU holds", "sub2"))
    body, yb = prose(372, [
        "Splitting a model means giving each GPU a shard: its own piece of the weights, or of the "
        "input. There are four places to cut. By layers, inside every weight matrix, between "
        "experts, or along the sequence of tokens. Experts are the many small networks a "
        "mixture-of-experts model picks among for each token ({{fig:v05-n25}}). A fifth "
        "strategy makes no cut at all and copies "
        "the whole model instead.",
        "Every cut line is a place where the GPUs on either side must exchange data, because nobody "
        "holds everything needed to finish a token. Where the line goes decides what has to cross "
        "it, and how often.",
    ])
    emit("o003", stamp(SRT, "The model has to be split across many"),
         "Four ways to cut a model, and one way to copy it", yb + 26, b + [body],
         "Five strategies, five places to put the line, and the parts that follow take them one at "
         "a time. The copy is the odd one out: it has nothing to say while serving.")


# ---- Fig 4: the wait, as a lane chart ------------------------------------------------------------
def o004():
    X0, U = 130, 54                                       # time axis: one unit = 54 px
    lanes = ["one GPU", "GPU A", "the wire", "GPU B"]
    b = [hd(40, 40, "One forward pass of 80 layers, on one GPU and split across two")]
    Y = [62, 112, 146, 180]
    for lab, y in zip(lanes, Y):
        b.append(txt(40, y + 18, lab, "cap"))

    def busy(t0, t1, y, cls, label):
        b.append(cell(X0 + t0 * U, y, (t1 - t0) * U - 4, 26, cls, label=label))

    def idle(t0, t1, y, label="idle"):
        b.append(ghost(X0 + t0 * U, y, (t1 - t0) * U - 4, 26, label=label))

    busy(0, 8, Y[0], "m", "layers 1–80")
    busy(0, 4, Y[1], "m", "layers 1–40")
    idle(4, 9, Y[1], "done, and idle")
    idle(0, 4, Y[2], "")
    busy(4, 5, Y[2], "h", "send")
    idle(5, 9, Y[2], "")
    idle(0, 5, Y[3], "waiting for A's output")
    busy(5, 9, Y[3], "m", "layers 41–80")
    b.append(ln(X0, 222, X0 + 9 * U, 222, "axis"))
    b.append(txt(X0 + 9 * U - 4, 240, "time", "sub2", "end"))
    b.append(txt(X0 + 8 * U - 4, 100, "one GPU done", "sub2", "end"))
    body, yb = prose(280, [
        "On a single GPU there is nothing to coordinate. Weights, activations and the KV cache, the "
        "keys and values kept for every earlier token, all live in one memory, and each layer's "
        "output feeds the next layer directly.",
        "Put the first half of the layers on GPU A and the second half on B. B cannot start until "
        "A's output crosses a wire, and while that transfer is in flight, B sits idle. Time spent "
        "communicating is time not spent computing. A, its half done, waits too: the bubble of Part 4.",
        "Splitting turns a compute problem into a compute-plus-communication problem. Every "
        "strategy below gets the same two questions: what does it have to send, and how often?",
    ])
    emit("o004", stamp(SRT, "On a single GPU, there is nothing to"),
         "While a message is in flight, the GPU waiting for it sits idle", yb + 26, b + [body],
         "Lengths schematic. Every dashed stretch is time bought and not used; what is sent, and how "
         "often, decide how long those stretches get.")


# ---- Fig 5: the second pressure ------------------------------------------------------------------
def o005():
    b = [eq(40, 40, 600, "cache  =  2 × layers × KV heads × head size × bytes × tokens × requests", "m")]
    b.append(hd(40, 116, "Two pressures, over one generation (schematic)"))
    X0, CW, G = 200, 46, 10
    for k in range(5):
        x = X0 + k * (CW + G)
        b.append(cell(x, 176 - 40, CW, 40, "h"))
        hgt = 8 * (k + 1)
        b.append(cell(x, 236 - hgt, CW, hgt, "m"))
    b.append(txt(40, 162, "the weights", "cap"))
    b.append(txt(40, 230, "the KV cache", "cap"))
    b.append(txt(X0 + 5 * (CW + G) + 6, 162, "fixed before anything runs", "sub2"))
    b.append(txt(X0 + 5 * (CW + G) + 6, 230, "one more token's worth per step", "sub2"))
    for k in range(5):
        b.append(txt(X0 + k * (CW + G) + CW / 2, 256, f"step {k + 1}", "sub2", "middle"))
    body, yb = prose(304, [
        "Each new token attends over every token before it, and that comparison needs a key and a "
        "value for every earlier position at every layer ({{fig:v01-o136}}). Recomputing them at "
        "every step would repeat nearly all the work of the steps before, so the model computes them "
        "once and keeps them: the KV cache.",
        "The cache grows with every token of context and every request in the batch, and "
        "multiplies again across every layer of the model.",
        "So two memory pressures force the split: the weights, too big before anything runs, and "
        "the cache, which grows while it runs.",
    ])
    emit("o005", stamp(SRT, "Two memory pressures force the split"),
         "The second pressure grows while the model runs", yb + 26, b + [body],
         "One is static and one is dynamic. Different strategies below answer each, which is why "
         "real deployments run several at once.")


# ---- N2: a million tokens of cache ---------------------------------------------------------------
def n2():
    per = KV_PER_TOKEN
    t128, t1m = 128_000, 1_000_000
    c128, c1m = per * t128, per * t1m
    t_eq = WEIGHT_BYTES / per                      # tokens whose cache equals the 16-bit weights
    t_full = B200_MEM / per                        # tokens whose cache fills a B200 on its own
    assert round(c128 / 1e9, 1) == 41.9 and round(c1m / 1e9, 1) == 327.7
    assert round(t_eq) == 427_246 and round(t_full) == 585_938
    terms = [("2", "key and value"), ("80", "layers"), ("8", "KV heads"), ("128", "numbers each"),
             ("2", "bytes each")]
    b = [hd(40, 40, "Bytes per token of context, for the 70B model")]
    x = 40
    for k, (v, note) in enumerate(terms):
        w = 64
        b.append(cell(x, 56, w, 34, "u", label=v))
        b.append(txt(x + w / 2, 108, note, "sub2", "middle"))
        x += w
        b.append(txt(x + 11, 78, "×" if k < 4 else "=", "sub2", "middle"))
        x += 22
    b.append(cell(x, 56, 640 - x, 34, "m", label=f"{n(per)} bytes per token"))
    X0, SC = 210, 400 / 330                            # px per GB
    rows = [(f"{n(t128)} tokens", c128, f"{c128 / 1e9:.1f} GB, the 'around 40' of one request"),
            (f"{n(round(t_eq, -3))} tokens", WEIGHT_BYTES, "140 GB, as big as the 16-bit weights"),
            (f"{n(round(t_full, -3))} tokens", B200_MEM, "192 GB, a whole B200"),
            (f"{n(t1m)} tokens", c1m, None)]
    for k, (lab, v, note) in enumerate(rows):
        y = 134 + k * 38
        w = v / 1e9 * SC
        b.append(txt(40, y + 18, lab, "cap"))
        cls = "h" if v > B200_MEM else "m"
        if note is None:
            b.append(cell(X0, y, w, 26, cls, label=f"{v / 1e9:.1f} GB, more than any one GPU here"))
        else:
            b.append(cell(X0, y, w, 26, cls))
            b.append(txt(X0 + w + 10, y + 18, note, "sub2"))
    body, yb = prose(324, [
        f"Per token the cache holds a key and a value for every layer and every KV head: "
        f"2 × 80 × 8 × 128 × 2 = {n(per)} bytes, about a third of a megabyte ({{{{fig:v01-o140}}}}). "
        f"Multiply by the context: {n(t128)} tokens is {c128 / 1e9:.1f} GB, the 'around 40 GB' for "
        "a single request.",
        f"At about {n(round(t_eq, -3))} tokens the cache equals the model's own 140 GB of weights. "
        f"At {n(round(t_full, -3))} it would fill a 192 GB B200 with nothing else on it, and a "
        f"million tokens needs {c1m / 1e9:.0f} GB: one sequence overflows a GPU on its own.",
    ])
    emit("n2", stamp(SRT, "For a 70 billion parameter model"),
         "A million tokens of cache is bigger than the chip", yb + 26, b + [body],
         "Bars to scale. The weights are a fixed bill; the cache is charged per token and per request, "
         "and at long context it, not the weights, decides how many GPUs one request needs.")


if __name__ == "__main__":
    for fn in (o001, o002, n1, o003, o004, o005, n2):
        fn()
