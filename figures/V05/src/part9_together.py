"""V5 Part 9, putting them together: N41 and N42 of plans/depth_pass/V05_review.md, with Figs 23-25
rebuilt (Fig 23's places, Fig 24's source named, Fig 25 restamped).

  python3 figures/V05/src/part9_together.py     writes items o023-o025, n41, n42
"""
from v05common import *  # noqa: F401,F403

# Megatron-LM (Shoeybi et al., 2019): 8.3 billion parameters on 512 V100s, 8-way model parallel and
# 64-way data parallel; 15.1 PFLOPS sustained against a single-GPU baseline of 39 TFLOPS ("76%").
MEG_PFLOPS, MEG_BASE, MEG_GPUS = 15.1e15, 39e12, 512


# ---- Fig 23: the full map ------------------------------------------------------------------------
def o023():
    rows = [("Tensor", "two all-reduces per layer", "h", "inside a node, on NVLink"),
            ("Pipeline", "one thin handoff per stage", "h", "across nodes, on the network"),
            ("Expert", "two all-to-alls per layer", "h", "the fast domain, or it suffers"),
            ("Sequence", "a ring, hidden behind compute", "h", "wherever compute hides the ring"),
            ("Data", "nothing at all", "s", "around the rest, as copies")]
    b = [hd(40, 46, "Five strategies, each placed where its traffic can afford to live"),
         txt(140, 70, "what it sends", "sub2"), txt(390, 70, "where it lives", "sub2")]
    for k, (name, what, c, where) in enumerate(rows):
        y = 80 + k * 50
        b.append(txt(40, y + 21, name, "cap"))
        b.append(cell(140, y, 220, 32, c, label=what, rx=4))
        b.append(arr(366, y + 16, 384, y + 16))
        b.append(cell(390, y, 250, 32, "u", label=where, rx=4))
    body, yb = prose(364, [
        "No real system picks just one strategy. A production deployment can run all five at once, "
        "each placed where its traffic can afford to live. Tensor parallelism talks constantly, twice "
        "every layer, so it stays inside a node on NVLink; pipeline parallelism sends one thin "
        "handoff per stage, so it is the strategy that crosses between boxes.",
        "Expert parallelism's all-to-alls stay on the same fast domain and suffer wherever they spill "
        "past it. Sequence parallelism hides its ring of key-value blocks behind the compute to serve "
        "long context, and data parallelism says nothing at all: it wraps the finished unit in "
        "copies, the outermost layer of virtually every real deployment.",
    ])
    emit("o023", stamp(SRT, "No real system picks just one strategy"),
         "Each strategy lives where its traffic can afford to", yb + 26, b + [body],
         "Read the two columns together. Placement is decided by how much a strategy has to say and "
         "how often.")


# ---- N41: one replica, drawn ---------------------------------------------------------------------
def n41():
    tp, pp, copies = 8, 4, 4
    per_copy, total = tp * pp, tp * pp * copies
    per_gpu = DS_PARAMS / per_copy / 1e9
    assert (per_copy, total, per_gpu, B200_MEM / 1e9 - per_gpu) == (32, 128, 50, 142)
    b = [cont(40, 40, 432, 398, "u", "One copy of the model: 4 stages, one per node")]
    for k in range(pp):
        y = 82 + k * 88
        b.append(cont(60, y, 392, 74, "s", f"node {k + 1}: pipeline stage {k + 1}"))
        for g in range(tp):
            b.append(cell(80 + g * 45, y + 38, 38, 20, "m", rx=2))
        if k < pp - 1:
            b.append(arr(256, y + 76, 256, y + 86))
    b.append(txt(482, 68, "the handoffs between", "sub2"))
    b.append(txt(482, 84, "nodes are the only", "sub2"))
    b.append(txt(482, 100, "traffic on the network", "sub2"))
    for k in range(copies - 1):
        y = 128 + k * 104
        b.append(cont(490, y, 150, 90, "u", f"copy {k + 2}", sub="the same 32 GPUs"))
    x = 40
    for s_, c, w in [("8 GPUs", "u", 70), ("×", None, 24), ("4 stages", "u", 80), ("=", None, 24),
                     ("32 per copy", "m", 104), ("×", None, 24), ("4 copies", "u", 80), ("=", None, 24),
                     ("128 GPUs", "m", 170)]:
        if c is None:
            b.append(txt(x + w / 2, 478, s_, "sub2", "middle"))
        else:
            b.append(cell(x, 460, w, 30, c, label=s_))
        x += w
    body, yb = prose(536, [
        "Read it inside out. Eight GPUs on NVLink form a tensor-parallel group, the only split chatty "
        "enough to need the fast domain. Four such nodes form a pipeline, one stage per node, so only "
        "thin handoffs cross the network. That is one copy of the model: 8 × 4 = 32 GPUs.",
        f"Each holds 1,600 GB ÷ 32 = {per_gpu:.0f} GB of DeepSeek V4 Pro's FP8 weights, leaving "
        f"{B200_MEM / 1e9 - per_gpu:.0f} GB of a 192 GB B200 for the cache. Data parallelism then "
        "stamps out copies: four here, 128 GPUs in all. In mixture-of-experts layers, expert "
        "parallelism takes the place of one of these cuts inside the fast domain.",
    ])
    emit("n41", stamp(SRT, "A production deployment can run all five"),
         "One replica, drawn: the strategies nest", yb + 26, b + [body],
         "Illustrative: the numbers are chosen to show the nesting, not taken from any real "
         "deployment. The order is the point: the chattiest split innermost, the silent one outside.")


# ---- N42: what each split divides ----------------------------------------------------------------
def n42():
    COLS = [(192, 122, "weights per GPU"), (318, 124, "cache per GPU"), (446, 194, "what it sends, how often")]
    rows = [("Tensor", "buys a faster token", [("÷ 8", "s"), ("÷ 8 at most", "s"), ("2 all-reduces per layer", "h")]),
            ("Pipeline", "buys room across boxes", [("÷ stages", "s"), ("÷ stages", "s"),
                                                   ("1 handoff per stage boundary", "h")]),
            ("Expert", "buys room for experts", [("experts ÷ GPUs", "s"), ("unchanged", "u"),
                                                ("2 all-to-alls per MoE layer", "h")]),
            ("Data", "buys throughput only", [("unchanged", "u"), ("unchanged", "u"), ("nothing at all", "s")]),
            ("Sequence", "buys long context", [("unchanged", "u"), ("÷ GPUs, no limit", "s"),
                                              ("a ring of key-value blocks", "h")])]
    b = [hd(40, 40, "Approximately, for the shapes in this video")]
    for x, w, h_ in COLS:
        b.append(txt(x, 68, h_, "sub2"))
    for k, (name, buys, cells) in enumerate(rows):
        y = 78 + k * 48
        b.append(txt(40, y + 14, name, "cap"))
        b.append(txt(40, y + 30, buys, "sub2"))
        for (x, w, _), (s_, c) in zip(COLS, cells):
            b.append(cell(x, y, w, 34, c, label=s_))
    body, yb = prose(340, [
        "Tensor parallelism is the strategy that makes a single token faster: it divides the weights "
        "every decode step must read ({{fig:v05-n18}}). Sequence parallelism also shortens one long "
        "prompt's prefill, since each GPU runs only its own chunk of the tokens. Pipeline and expert "
        "parallelism buy room; data parallelism buys throughput and nothing else.",
        "Only two splits divide the cache, and only one keeps dividing it as the context grows "
        "({{fig:v05-n31}}). Every split but data parallelism adds traffic, which is what decided where "
        "each one lives.",
    ])
    emit("n42", stamp(SRT, "data parallelism says nothing at all"),
         "What each split divides, and what it leaves alone", yb + 26, b + [body],
         "Read down a column to choose: weights that do not fit, a cache that does not fit and a token "
         "that is too slow each have a different answer.")


# ---- Fig 24: what scaling delivers ---------------------------------------------------------------
def o024():
    eff = MEG_PFLOPS / (MEG_GPUS * MEG_BASE)
    worth = MEG_PFLOPS / MEG_BASE
    assert f(100 * eff, 1) == "75.6" and round(100 * eff) == 76 and round(worth) == 387
    X0, W = 280, 340
    b = [txt(40, 78, "Ideal scaling", "cap"),
         cell(X0, 62, W, 32, "u", label=f"{MEG_GPUS} GPUs' worth of work"),
         txt(40, 138, "What was achieved", "cap"),
         cell(X0, 122, W * eff, 32, "s", label=f"{worth:.0f} GPUs' worth, {100 * eff:.1f}%")]
    body, yb = prose(196, [
        "Even placed perfectly, more GPUs never buy a proportional speed-up. When Nvidia trained "
        "Megatron-LM's 8.3-billion-parameter model across 512 V100 GPUs in 2019, tensor parallelism "
        "eight ways and 64 data-parallel copies, it sustained 15.1 petaFLOPS against 39 teraFLOPS "
        f"on one GPU: 15.1 ÷ (512 × 0.039) = {100 * eff:.1f}%, which the paper reports as 76%. That "
        "counted as a strong result.",
        f"Put another way, 512 GPUs did {worth:.0f} GPUs' worth of work; the rest went to "
        "communication and waiting. Communication always takes its cut.",
        "At 1.6 trillion parameters, DeepSeek V4 Pro has no single-device fallback to compare against. "
        "The communication map is the only way it runs.",
    ])
    emit("o024", stamp(SRT, "Even when placed perfectly"), "Communication always takes its cut",
         yb + 26, b + [body],
         "Bars to scale. A calibration from training on 2019 hardware, not a law: three quarters of "
         "ideal was considered good, which says how much of the problem communication is.")


# ---- Fig 25: the assumption left standing --------------------------------------------------------
def o025():
    act = DS_ACTIVE / DS_PARAMS
    assert f(100 * act, 1) == "3.1"
    b = [box(40, 55, 600, 66, "u", "384 experts per layer, six per token")]
    body, yb = prose(168, [
        "Expert parallelism exists because the model is built out of separate experts, and this "
        "video treated that as a given: 384 experts per layer, six per token, as if that were an "
        "obvious way to build a machine. It is not obvious at all.",
        "Why a model that touches barely 3% of its weights on every token still works, 49 billion of "
        "1.6 trillion, is the next episode.",
    ])
    emit("o025", stamp(SRT, "And one question is still open"), "The assumption left standing",
         yb + 26, b + [body],
         "A clean hand-off. The distribution strategy has been justified; the architecture it "
         "distributes has not.")


if __name__ == "__main__":
    for fn in (o023, n41, n42, o024, o025):
        fn()
