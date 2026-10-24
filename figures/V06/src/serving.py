"""V6 Part 11, where the bill arrives: P33-P42 of plans/depth_pass/V06_review.md, with Fig 20 (o020) and
Fig 21 (o021) redrawn. Fig 21's old labels cut words in half across lines; the new one keeps every label
inside its box.

Sources, read for this build: DeepSeek-V3 report §3.2.1 (computation to communication about 1:1 in
training, before DualPipe), §3.2.2 (NVLink 160 GB/s, InfiniBand 50 GB/s, at most 4 nodes per token, sent
once per node then forwarded), §3.3 (dispatch in FP8, combine in BF16, in training), §3.4 (prefill: 32
redundant experts, two overlapped micro-batches; decode: 320 GPUs, one expert each, 64 for redundant and
shared experts, expert batches "usually within 256 tokens" and memory bound); its config.json (n_group 8,
topk_group 4); NVIDIA's H100 page (FP8 3,958 TFLOP/s with sparsity, so 1,979 dense; 3.35 TB/s).

  python3 figures/V06/src/serving.py      writes p33 ... p42, o020, o021 in figures/V06/items/
"""
import json, math
from common import (DS, H100, at, box, cell, cont, dashed, dsv3, emit, emit_html, f, hd, ln, n, nb, pct,
                    prose, rect, txt)

V = dsv3()
EXPERT = V["expert"]
MOE = V["moe_layers"]
N_R, K = DS["routed"], DS["k"]


def box2(x, y, w, h, cls, line1, line2):
    """A box holding two centred lines of the smaller label size."""
    c = x + w / 2
    return (f'<g class="{cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6"/>'
            f'<text class="sub" x="{c}" y="{y + h / 2 - 9}" text-anchor="middle" dominant-baseline="central">{line1}</text>'
            f'<text class="sub" x="{c}" y="{y + h / 2 + 9}" text-anchor="middle" dominant-baseline="central">{line2}</text></g>')


def arrow(x1, y1, x2, y2):
    return f'<line class="conn" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" marker-end="url(#arw)"/>'


# ---- P33: one expert per GPU means one expert from every layer -----------------------------------
def p33():
    per_gpu = MOE * EXPERT
    assert MOE == 58 and round(per_gpu / 1e9, 2) == 2.55 and round(100 * per_gpu / H100["hbm"], 1) == 3.2
    assert MOE * N_R == 14_848
    b = [hd(40, 46, "GPU k of the 320 in DeepSeek V3's decode deployment")]
    b.append(cont(40, 62, 600, 120, "u", "GPU k holds expert k of every MoE layer"))
    CW, G = 17, 2
    for i in range(MOE):
        r, c = divmod(i, 29)
        b.append(rect(62 + c * (CW + G), 100 + r * (CW + G + 4), CW, CW, "m", rx=2))
    b.append(txt(62, 168, f"layers 4 to 61: {MOE} experts, one from each MoE layer", "sub2"))
    b.append(hd(40, 224, "Its 80 GB of memory, to scale"))
    W = 600
    w = per_gpu / H100["hbm"] * W
    b.append(rect(40, 240, w, 30, "m"))
    b.append(rect(40 + w, 240, W - w, 30, "u"))
    b.append(txt(40, 290, f"{per_gpu / 1e9:.2f} GB of experts, {pct(per_gpu / H100['hbm'])}", "sub2"))
    b.append(txt(640, 290, "the rest: its share of attention weights, and the KV cache", "sub2", "end"))
    body, y = prose(338, [
        f"Each MoE layer has its own router and its own {N_R} routed experts, so the model holds "
        f"{nb(f'{MOE} × {N_R} = {n(MOE * N_R)}')} routed experts in all. One expert per GPU, in DeepSeek V3's "
        f"decode deployment, means one expert number per GPU: GPU k holds expert k of each of the {MOE} "
        "MoE layers.",
        f"That is {nb(f'{MOE} × {EXPERT / 1e6:.2f} million')} = {per_gpu / 1e9:.2f} billion weights, "
        f"{per_gpu / 1e9:.2f} GB at one byte each: {pct(per_gpu / H100['hbm'])} of an 80 GB card. The other "
        "64 GPUs hold the shared expert and redundant copies of the busiest experts.",
    ])
    emit("p33", at("DeepSeek V3's decode deployment shows the scale"),
         "One expert per GPU means one expert from every layer", y + 32, b + [body],
         "Bar drawn to scale. Spread this thin, the experts take almost none of a card's memory; what "
         "fills it is the cache of the requests it serves.")


# ---- Fig 20: the communication bill (overview) -------------------------------------------------------
def o020():
    b = [hd(40, 46, "One token through one MoE layer")]
    steps = [(40, 110, "u", "sits on a GPU"), (176, 130, "s", "router picks 8"),
             (332, 148, "h", "dispatch, all-to-all"), (506, 134, "h", "combine, back")]
    for k, (x, w, cl, lab) in enumerate(steps):
        b.append(box(x, 70, w, 40, cl, lab))
        if k:
            px_, pw = steps[k - 1][0], steps[k - 1][1]
            b.append(arrow(px_ + pw + 6, 90, x - 6, 90))
    b.append(txt(40, 152, "Measured in DeepSeek's training runs, before optimisation", "hd"))
    b.append(txt(40, 186, "computing", "cap"))
    b.append(rect(220, 170, 200, 26, "m"))
    b.append(txt(40, 224, "waiting on the network", "cap"))
    b.append(rect(220, 208, 200, 26, "h"))
    b.append(txt(432, 204, "roughly one to one", "sub2"))
    body, y = prose(280, [
        "The router picks eight experts, and those experts live mostly on other machines. So every MoE "
        "layer runs two all-to-all exchanges ({{fig:v05-o016}}): a dispatch that ships each token out to "
        "the GPUs holding its chosen experts, and a combine that carries the results back home.",
        "Both sit on the decode critical path, the time per output token ({{fig:v01-o143}}). Before "
        "optimisation, DeepSeek's training runs showed computation and communication at roughly one to "
        "one: for every moment computing, a moment waiting on the network.",
        "Meanwhile every expert stays resident in memory, busy or not, which is why the economics hinge on "
        "how many tokens arrive together ({{fig:v06-p37}}).",
    ])
    emit("o020", at("Now, follow one token through a layer"), "The communication bill", y + 32, b + [body],
         "Schematic bars. The one-to-one ratio is a training measurement taken before DeepSeek's "
         "optimisations, not a serving figure; what it shows is that the shuffling can cost as much as the "
         "work it feeds.")


# ---- P34: what one token sends in one layer --------------------------------------------------------
def p34():
    d = DS["d"]
    out_b, back_b = K * d * 1, K * d * 2                 # FP8 out, BF16 back
    total = out_b + back_b
    assert (out_b, back_b, total) == (57_344, 114_688, 172_032) and round(MOE * total / 1e6, 1) == 10.0
    b = [hd(40, 46, "Bytes one token sends through one MoE layer, to scale")]
    X0, SC = 210, 400 / back_b
    for k, (lab, each, cl, note) in enumerate([("out: dispatch", d * 1, "h", "8 copies of its vector, FP8"),
                                               ("back: combine", d * 2, "h", "8 results, BF16")]):
        y = 70 + k * 64
        b.append(txt(40, y + 19, lab, "cap"))
        for i in range(K):
            b.append(rect(X0 + i * each * SC, y, each * SC, 28, cl))
        b.append(txt(X0, y + 46, f"{note}: {nb(f'8 × {n(each)}')} = {n(K * each)} bytes", "sub2"))
    body, y = prose(70 + 2 * 64 + 50, [
        f"To reach its experts, a token's vector, {n(d)} numbers, is copied to each of the 8 GPUs that "
        f"hold them. DeepSeek V3 sends those copies in FP8, one byte a number: {n(out_b)} bytes out.",
        f"Each expert sends back its output, another {n(d)} numbers, kept in BF16, a 16-bit format "
        f"({{{{fig:v04-o030}}}}), at two bytes: "
        f"{n(back_b)} bytes back. Together {n(total)} bytes, {total / 1e3:.0f} KB, for one token in one "
        f"layer, and the {MOE} MoE layers make {MOE * total / 1e6:.1f} MB for every token generated.",
        "The precisions are the ones DeepSeek's report gives for its training traffic. The count assumes "
        "every chosen expert sits on a different GPU, as it does when each GPU holds one.",
    ])
    emit("p34", at("a dispatch which ships each token out"), "What one token sends in one layer: 172 kilobytes",
         y + 32, b + [body],
         "Bars drawn to scale. Small for one token, but paid twice in every MoE layer for every token in "
         "flight, across the network between machines.")


# ---- P35: the critical path ----------------------------------------------------------------------------
def p35():
    seq = [("attention", "m", 2), ("router", "s", 0.25), ("dispatch", "h", 2), ("experts", "m", 2),
           ("combine", "h", 2)]
    total = sum(w for _, _, w in seq)
    comp = sum(w for _, c, w in seq if c != "h")
    net = total - comp
    assert abs(net - comp) <= 0.25                       # one to one, give or take the router
    b = [hd(40, 46, "One MoE layer at decode, step after step (schematic, 1:1)")]
    X0, U = 140, 470 / total
    lanes = [("GPU computes", 76), ("network sends", 116)]
    for lab, y in lanes:
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(dashed(X0, y, total * U, 26))
    x = X0
    for name, cl, w in seq:
        y = 116 if cl == "h" else 76
        if w >= 1:
            b.append(cell(x, y, w * U, 26, cl, label=name))
        else:
            b.append(rect(x, y, w * U, 26, cl))
        x += w * U
    b.append(txt(X0 + 2 * U + 2, 70, "router", "sub2"))
    b.append(arrow(X0 + total * U + 4, 89, X0 + total * U + 30, 89))
    b.append(txt(X0 + total * U + 4, 160, "next layer", "sub2", "end"))
    b.append(txt(X0, 176, f"each step starts only when the one before has finished: the times add", "sub2"))
    body, y = prose(220, [
        "A step is on the critical path when something after it has to wait for it. Inside one MoE layer "
        "every step needs the previous step's output: the experts cannot start before the token arrives, "
        "and the next layer cannot start before the results come back. So their times add, and the time "
        "per output token is the sum along that chain, layer after layer.",
        "Drawn at the one-to-one ratio DeepSeek measured in training before optimisation, the GPU spends "
        "half of every MoE layer waiting for the network, and the network half of it waiting for the GPU.",
    ])
    emit("p35", at("Both sit on the decode critical path"), "The critical path: steps a token can neither skip nor reorder",
         y + 32, b + [body],
         "Schematic. Anything on the critical path costs latency at full price; the tricks later in this "
         "part work by moving the network's half off it.")


# ---- P36: grouping tokens by expert ---------------------------------------------------------------------
TC = [[0, 1], [0, 2], [3, 0], [0, 1], [0, 2], [2, 0], [1, 2], [3, 2]]   # token choice picks of Fig P24


def p36():
    groups = [[t for t in range(8) if e in TC[t]] for e in range(4)]
    sizes = [len(g) for g in groups]
    assert sizes == [6, 3, 5, 2]
    inten = [2 * s for s in sizes]
    b = [hd(40, 46, "The eight tokens of the routing example, regrouped by expert")]
    for t in range(8):
        y = 70 + t * 28
        b.append(txt(40, y + 16, f"t{t + 1}", "cap"))
        for k, e in enumerate(sorted(TC[t])):
            b.append(cell(80 + k * 44, y, 40, 22, "u", label=f"E{e + 1}"))
    b.append(txt(80, 70 + 8 * 28 + 14, "each token's two experts", "sub2"))
    X1 = 250
    for e in range(4):
        y = 70 + e * 52
        b.append(txt(X1, y + 16, f"E{e + 1}", "cap"))
        for k, t in enumerate(groups[e]):
            b.append(cell(X1 + 34 + k * 36, y, 32, 22, "m", label=f"t{t + 1}"))
        b.append(txt(X1 + 34, y + 40, f"{sizes[e]} tokens: weights read once, used {sizes[e]} times, "
                                      f"{inten[e]} operations per byte", "sub2"))
    body, y = prose(70 + 8 * 28 + 52, [
        "A serving system decodes many requests together. Each step makes the next token for every one "
        "of them, so a step carries B tokens, one per request. After routing, those tokens are regrouped "
        "by destination, and each expert receives a small batch of its own: the eight tokens of "
        "{{fig:v06-p24}} become batches of 6, 3, 5 and 2.",
        "An expert reads its weights once per step and applies them to every token in its batch. At one "
        "byte a weight and two operations per weight per token, it does 2 × its token count operations "
        "per byte read: the batching rule of {{fig:v04-o055}}, applied to each expert separately.",
        f"However large the step, an expert sees only its slice. With {K} of {N_R} experts per token, a "
        f"step of B tokens gives each expert, on average, {nb(f'B × {K} / {N_R} = B / {N_R // K}')} of them.",
    ])
    emit("p36", at("the economics hinge on concurrency"), "Grouping tokens by expert turns one batch into many small ones",
         y + 32, b + [body],
         "A step of B tokens is not one batch but N small ones. Whether they are big enough to keep the chip "
         "busy is the question of the next two figures.")


# ---- P37: how many experts a batch wakes up --------------------------------------------------------
woken = lambda B: N_R * (1 - ((N_R - K) / N_R) ** B)


def p37():
    pts = [1, 8, 32, 64, 128, 256]
    vals = [woken(B) for B in pts]
    assert [round(v) for v in vals] == [8, 57, 163, 222, 252, 256]
    assert round(K * 64 / woken(64), 1) == 2.3
    b = [hd(40, 46, "Experts with at least one token, against tokens in the step")]
    L, R, T, B_ = 80, 600, 70, 250
    px = lambda B: L + math.log2(B) / 10 * (R - L)
    py = lambda v: B_ - v / 256 * (B_ - T)
    b.append(ln(L, B_, R, B_, "axis"))
    b.append(ln(L, T, L, B_, "axis"))
    for B in (1, 4, 16, 64, 256, 1024):
        b.append(ln(px(B), B_, px(B), B_ + 4, "tick"))
        b.append(txt(px(B), B_ + 18, n(B), "sub2", "middle"))
    for v in (0, 128, 256):
        b.append(txt(L - 8, py(v) + 4, str(v), "sub2", "end"))
    b.append(txt((L + R) / 2, B_ + 38, "tokens in the step, on a logarithmic axis", "sub2", "middle"))
    curve = " ".join(f"{px(2 ** (i / 20)):.1f},{py(woken(2 ** (i / 20))):.1f}" for i in range(0, 201))
    b.append(f'<polyline class="pl-m" points="{curve}"/>')
    for B, v in zip(pts, vals):
        b.append(f'<circle cx="{px(B):.1f}" cy="{py(v):.1f}" r="4" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
        b.append(txt(px(B) + 8, py(v) + (16 if B > 1 else -10), f"{v:.0f}", "sub2 halo"))
    body, y = prose(B_ + 80, [
        f"One token wakes {K} of the {N_R} routed experts, so a given expert is left out by it with "
        f"probability {N_R - K}/{N_R}. If the tokens of a step choose independently, an expert is left out by "
        f"all B of them with probability ({N_R - K}/{N_R})^B: the same chance, multiplied B times.",
        f"So B tokens wake on average {nb(f'{N_R} × (1 − ({N_R - K}/{N_R})^B)')} experts: {vals[1]:.0f} for 8 "
        f"tokens, {vals[2]:.0f} for 32, {vals[3]:.0f} for 64, and nearly all for 256.",
        "That assumes every expert is equally likely, which real routing is not; skewed traffic wakes fewer "
        f"for the same crowd. And woken is not busy: at 64 tokens the {vals[3]:.0f} woken experts get "
        f"{K * 64 / vals[3]:.1f} tokens each.",
    ])
    emit("p37", at("thousands of simultaneous requests"), "How many experts a batch wakes up", y + 32, b + [body],
         "All 256 experts have something to do from a few hundred tokens up. Having enough to do takes a "
         "far bigger crowd, counted next.")


# ---- P38: an expert waits on memory until it holds about 295 tokens --------------------------------------
RIDGE = H100["fp8"] / H100["bw"]                         # operations per byte where the two ceilings meet
T_STAR = RIDGE / 2                                       # 2 operations per weight per token, 1 byte a weight


def p38():
    b_star = T_STAR * N_R / K
    assert round(RIDGE) == 591 and round(T_STAR) == 295 and round(b_star, -1) == 9450
    assert 2 * 256 < RIDGE                               # DeepSeek's "usually within 256 tokens": memory bound
    b = [hd(40, 46, "Tokens per expert in one step, on a logarithmic axis")]
    L, R, y0 = 60, 620, 120
    px = lambda t: L + math.log10(t) / 3 * (R - L)
    b.append(rect(L, y0, px(T_STAR) - L, 26, "h"))
    b.append(rect(px(T_STAR), y0, R - px(T_STAR), 26, "s"))
    b.append(txt(L + 10, y0 + 17, "waiting on memory", "sub2"))
    b.append(txt(R - 10, y0 + 17, "busy", "sub2", "end"))
    for t in (1, 10, 100, 1000):
        b.append(ln(px(t), y0 + 26, px(t), y0 + 32, "tick"))
        b.append(txt(px(t), y0 + 46, n(t), "sub2", "middle"))
    marks = [(1, "1: one token on its own", -1, "start"), (K * 64 / woken(64), "2.3: a 64-token step", 1, "start"),
             (256, "256: DeepSeek's usual most", 1, "end"), (T_STAR, f"{T_STAR:.0f}: the ridge", -1, "middle")]
    for t, lab, side, anchor in marks:
        x = px(t)
        if side < 0:
            b.append(ln(x, y0 - 4, x, y0 - 12, "tick"))
            b.append(txt(x, y0 - 18, lab, "sub2", anchor))
        else:
            b.append(ln(x, y0 + 52, x, y0 + 60, "tick"))
            b.append(txt(x, y0 + 74, lab, "sub2", anchor))
    body, y = prose(y0 + 116, [
        "An expert reads its weights once per step and uses each for every token in its batch: 2 operations "
        "per weight per token, against 1 byte read per weight at FP8. So T tokens give 2T operations per "
        "byte ({{fig:v04-o055}}).",
        f"An H100 does 1,979 trillion FP8 operations a second and reads 3.35 trillion bytes, so it waits on "
        f"memory below {nb(f'1,979 / 3.35 = {RIDGE:.0f}')} operations per byte ({{{{fig:v01-o126}}}} derives "
        f"the same kind of ridge in 16 bits). 2T reaches {RIDGE:.0f} at T = {T_STAR:.0f} tokens per expert.",
        f"With {K} of {N_R} experts per token, an expert gets on average B / {N_R // K} of a step's B tokens; "
        f"{T_STAR:.0f} each needs a step of about {n(int(round(b_star, -1)))} tokens. DeepSeek reports its "
        "decode experts' batches usually within 256 tokens: 512 operations per byte, still waiting on "
        "memory, as its report says.",
    ])
    emit("p38", at("each expert's batch usually stays within 256 tokens"),
         "An expert waits on memory until it holds about 295 tokens", y + 32, b + [body],
         "Even DeepSeek's own crowd keeps its experts on the memory side of the ridge, on an H100's numbers. "
         "A single user's token leaves them almost entirely idle.")


# ---- P39: the batch slider (a widget) -------------------------------------------------------------------
BS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384]
NONEXP = sum(V["parts"][k] for k in ("attention", "dense_ffn", "shared", "routers", "head", "norms"))
HELD = V["total"]
SEED = 39


def mulberry32(seed):
    a = seed & 0xFFFFFFFF

    def rnd():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((a ^ (a >> 15)) * (a | 1)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return rnd


def route_layer(B):
    """B tokens, each choosing K distinct experts uniformly (a partial shuffle): tokens per expert."""
    r = mulberry32(SEED)
    pool = list(range(N_R))
    load = [0] * N_R
    for _ in range(B):
        for j in range(K):
            k = j + math.floor(r() * (N_R - j))
            pool[j], pool[k] = pool[k], pool[j]
            load[pool[j]] += 1
    return load


def gb(v):
    return f"{v / 1e9:.1f} GB" if v >= 1e9 else f"{v / 1e9:.3f} GB"


def state(B):
    load = route_layer(B)
    busy = sum(1 for x in load if x)
    exp_woken = woken(B)
    read = NONEXP + MOE * exp_woken * EXPERT
    return dict(load=load, busy=busy, per=K * B / busy, woken=exp_woken, read=read, per_token=read / B,
                cls=["u" if x == 0 else ("s" if x >= T_STAR else "m") for x in load])


GX, GY, GC = 40, 66, 15                                 # the expert grid: left, top, cell pitch
RX, RW = 330, 300                                       # readouts column and the bars' full width


def readout_texts(s, B):
    return {"B": n(B), "busy": str(s["busy"]), "woken": f(s["woken"], 1), "per": f(s["per"], 1),
            "ops": f(2 * s["per"], 1), "read": gb(s["read"]), "pertok": gb(s["per_token"])}


P39_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const BS = __BS__, NR = __NR__, K = __K__, MOE = __MOE__, EXPERT = __EXPERT__, NONEXP = __NONEXP__,
        HELD = __HELD__, SEED = __SEED__, TSTAR = __TSTAR__, RX = __RX__, RW = __RW__, I0 = __I0__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val'), q = s => fig.querySelector(s);
  const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const group = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const gb = v => v >= 1e9 ? (v / 1e9).toFixed(1) + ' GB' : (v / 1e9).toFixed(3) + ' GB';
  function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function draw() {
    const B = BS[+sl.value]; val.textContent = group(B);
    const r = mulberry32(SEED), pool = [...Array(NR).keys()], load = new Array(NR).fill(0);
    for (let t = 0; t < B; t++) for (let j = 0; j < K; j++) {
      const k = j + Math.floor(r() * (NR - j)); const tmp = pool[j]; pool[j] = pool[k]; pool[k] = tmp; load[pool[j]]++;
    }
    const busy = load.filter(x => x > 0).length, per = K * B / busy;
    const woken = NR * (1 - Math.pow((NR - K) / NR, B)), read = NONEXP + MOE * woken * EXPERT;
    load.forEach((x, i) => q(`[data-c="${i}"]`).setAttribute('class', x === 0 ? 'u' : (x >= TSTAR ? 's' : 'm')));
    const set = (k, v) => q(`[data-r="${k}"]`).textContent = v;
    set('B', group(B)); set('busy', String(busy)); set('woken', fmt(woken, 1)); set('per', fmt(per, 1));
    set('ops', fmt(2 * per, 1)); set('read', gb(read)); set('pertok', gb(read / B));
    q('[data-bar="read"]').setAttribute('width', Math.max(read / HELD * RW, 2).toFixed(1));
  }
  sl.addEventListener('input', draw);
  q('button').addEventListener('click', () => { sl.value = I0; draw(); });
  draw();
})();</script>"""


def p39():
    i0 = 0
    s1 = state(1)
    assert s1["busy"] == K and round(s1["read"] / 1e9, 1) == 36.6 and s1["cls"].count("m") == K
    big = state(16384)
    assert big["busy"] == N_R and all(c == "s" for c in big["cls"])
    s512 = state(512)
    assert s512["busy"] == N_R and all(c == "m" for c in s512["cls"])   # all woken, all still waiting on memory
    b = [hd(40, 34, "One MoE layer at a step of B tokens: each square is one routed expert")]
    for i, cl in enumerate(s1["cls"]):
        r_, c_ = divmod(i, 16)
        b.append(f'<g class="{cl}" data-c="{i}"><rect x="{GX + c_ * GC}" y="{GY + r_ * GC}" width="{GC - 2}" '
                 f'height="{GC - 2}" rx="2"/></g>')
    gb_ = GY + 16 * GC
    for k, (cl, lab) in enumerate([("u", "no tokens"), ("m", "under 295 tokens: waiting on memory"),
                                    ("s", "295 or more: busy")]):
        y = gb_ + 14 + k * 20
        b.append(rect(GX, y, 12, 12, cl, rx=2))
        b.append(txt(GX + 20, y + 10, lab, "sub2"))
    t = readout_texts(s1, 1)
    lines = [("tokens in this step", "B", ""), ("experts with work, this layer", "busy", f" of {N_R}"),
             ("expected, over all 58 layers", "woken", ""), ("tokens per busy expert", "per", ""),
             ("its operations per byte", "ops", " (591 to be busy)")]
    for k, (lab, key, tail) in enumerate(lines):
        y = 82 + k * 26
        b.append(f'<text class="sub2" x="{RX}" y="{y}">{lab}: <tspan data-r="{key}">{t[key]}</tspan>{tail}</text>')
    yb = 82 + 5 * 26 + 18
    b.append(txt(RX, yb, "weights read this step, against 671 GB held, to scale", "sub2"))
    b.append(rect(RX, yb + 10, RW, 22, "u"))
    b.append(f'<g class="m"><rect x="{RX}" y="{yb + 10}" width="{max(s1["read"] / HELD * RW, 2):.1f}" height="22" '
             f'rx="3" data-bar="read"/></g>')
    b.append(f'<text class="sub2" x="{RX}" y="{yb + 52}">read: <tspan data-r="read">{t["read"]}</tspan>; '
             f'per token: <tspan data-r="pertok">{t["pertok"]}</tspan></text>')
    body, yb2 = prose(gb_ + 14 + 3 * 20 + 40, [
        "Each token in the step picks 8 of the 256 experts at random, every expert equally likely; the "
        "squares show one such draw for one layer. The expected count and the bytes are averages over all "
        "58 MoE layers, plus attention, the dense layers, the shared experts and the output head, which "
        "every step reads in full.",
        "At B = 1 the step reads 36.6 GB of the 671 GB held, to make one token, and eight experts each work "
        "on that single token. A few hundred tokens wake every expert, but each still waits on memory until "
        "about 9,450 tokens give it 295. The numbers on the page were checked against Python.",
    ])
    title = "Batch one: 671 GB held, 36.6 GB read, eight experts busy"
    ctl = (f"<label>tokens in the step <input type='range' min='0' max='{len(BS) - 1}' step='1' value='{i0}'>"
           f"<span class='val'>{n(BS[i0])}</span></label><button type='button'>Reset</button>")
    js = P39_JS
    for k, v in dict(BS=json.dumps(BS), NR=N_R, K=K, MOE=MOE, EXPERT=EXPERT, NONEXP=NONEXP, HELD=HELD,
                     SEED=SEED, TSTAR=repr(T_STAR), RX=RX, RW=RW, I0=i0).items():
        js = js.replace(f"__{k}__", str(v))
    emit_html("p39", f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; "
              f"{at('At batch one, you get the worst')}</div><h3>{title}</h3><div class='wg'><div class='ctl'>{ctl}</div>"
              f"<svg viewBox='0 0 680 {yb2 + 26}' role='img'><title>{title}</title>{''.join(b)}{body}</svg></div>"
              "<figcaption>The worst of both sides at batch one: the whole model held, a sliver of it read, and "
              "eight experts working on one token, with a KV cache as large as a dense model would carry. "
              "Sparsity pays only in a crowd.</figcaption>"
              f"{js}</figure>")


# ---- Fig 21: taming the all-to-alls (overview, rebuilt) ---------------------------------------------
def o021():
    b = [hd(40, 46, "Three tricks to keep the shuffling off the critical path")]
    tricks = [("Node-limited routing", "256 experts in 8 groups, one per node;", "each token reaches at most 4 nodes"),
              ("Overlap", "two staggered microbatches: one computes", "while the other is on the network"),
              ("Redundant experts", "the hottest experts copied to spare GPUs,", "their queues split between the copies")]
    for k, (name, l1, l2) in enumerate(tricks):
        y = 66 + k * 64
        b.append(box(40, y, 190, 52, "s", name))
        b.append(arrow(236, y + 26, 256, y + 26))
        b.append(box2(262, y, 378, 52, "u", l1, l2))
    body, y = prose(66 + 3 * 64 + 40, [
        "Left unchecked, the two all-to-alls in every layer would sink decode latency, so MoE serving leans "
        "on three tricks, each worked in the figures that follow.",
        "Notice what none of them removes. The bytes still cross the network, every MoE layer, every token. "
        "Node-limited routing moves some of them onto faster wires; overlap and redundancy only take the "
        "movement off the critical path, so the time per output token stops depending on it.",
    ])
    emit("o021", at("Left unchecked, those two all-to-alls"), "Taming the all-to-alls", y + 32, b + [body],
         "A distinction worth being precise about: the traffic is moved and hidden, never removed. Bandwidth "
         "is still consumed; it is just no longer in the way.")


# ---- P40: node-limited routing, worked --------------------------------------------------------------
GROUPS, PER_GROUP, M_NODES = DS["groups"], N_R // DS["groups"], DS["top_groups"]
HIGH = {(0, 3): .92, (0, 17): .88, (0, 25): .70, (1, 8): .85, (1, 20): .40, (2, 12): .83, (2, 30): .30,
        (3, 5): .80, (3, 22): .78, (3, 9): .65, (4, 14): .81, (4, 2): .35, (5, 27): .79, (5, 11): .38,
        (6, 6): .45, (6, 19): .42, (7, 15): .50, (7, 28): .36}


def affinities():
    r = mulberry32(40)
    a = [[0.05 + 0.25 * r() for _ in range(PER_GROUP)] for _ in range(GROUPS)]
    for (g, e), v in HIGH.items():
        a[g][e] = v
    return a


def p40():
    a = affinities()
    flat = sorted(((a[g][e], g, e) for g in range(GROUPS) for e in range(PER_GROUP)), reverse=True)
    free = flat[:K]
    score = [sum(sorted(row, reverse=True)[:K // M_NODES]) for row in a]
    kept = sorted(range(GROUPS), key=lambda g: -score[g])[:M_NODES]
    limited = sorted(((a[g][e], g, e) for g in kept for e in range(PER_GROUP)), reverse=True)[:K]
    free_nodes = sorted({g for _, g, _ in free})
    swapped_out = [(g, e) for _, g, e in free if (g, e) not in {(gg, ee) for _, gg, ee in limited}]
    swapped_in = [(g, e) for _, g, e in limited if (g, e) not in {(gg, ee) for _, gg, ee in free}]
    assert len(free_nodes) == 6 and kept == [0, 3, 1, 5]
    assert sorted(swapped_out) == [(2, 12), (4, 14)] and sorted(swapped_in) == [(0, 25), (3, 9)]
    d = DS["d"]
    assert (M_NODES * d, K * d) == (28_672, 57_344)
    chosen = {(g, e) for _, g, e in limited}
    b = [hd(40, 46, "One token's 256 affinities, laid out by node; amber = chosen, red = lost to the limit")]
    CW, X0, Y0 = 13, 100, 70
    for g in range(GROUPS):
        y = Y0 + g * 22
        b.append(txt(40, y + 13, f"node {g + 1}", "cap"))
        for e in range(PER_GROUP):
            cl = "m" if (g, e) in chosen else ("h" if (g, e) in swapped_out else "u")
            b.append(rect(X0 + e * CW, y, CW - 2, 16, cl, rx=2))
        top2 = sorted(a[g], reverse=True)[:2]
        mark = "kept" if g in kept else ""
        b.append(txt(X0 + PER_GROUP * CW + 10, y + 13,
                     f"{lab2(top2[0])} + {lab2(top2[1])} = {score[g]:.2f}  {mark}", "sub2"))
    yb = Y0 + GROUPS * 22 + 6
    b.append(txt(X0, yb + 12, "right: each node's two best affinities, added; the four best nodes are kept", "sub2"))
    b.append(hd(40, yb + 54, "Copies sent between machines, per token per layer, to scale"))
    SCb = 260 / (K * d)
    for k, (lab, copies) in enumerate([("without the limit, up to", K), ("with it, at most", M_NODES)]):
        y = yb + 70 + k * 36
        b.append(txt(40, y + 18, lab, "cap"))
        for i in range(copies):
            b.append(rect(220 + i * d * SCb, y, d * SCb, 26, "h"))
        b.append(txt(220 + copies * d * SCb + 10, y + 18, f"{copies} × {n(d)} = {n(copies * d)} bytes", "sub2"))
    body, y = prose(yb + 70 + 2 * 36 + 44, [
        f"DeepSeek V3's {N_R} experts sit in {GROUPS} groups of {PER_GROUP}, one group per node of its "
        f"{GROUPS}-node layout. For each token a node scores the sum of its {K // M_NODES} best affinities "
        f"({K} experts ÷ {M_NODES} nodes), the {M_NODES} best nodes are kept, and the token's {K} experts "
        "are chosen inside them.",
        f"Unconstrained, this token's best {K} would span {len(free_nodes)} nodes. The limit keeps nodes "
        f"{', '.join(str(g + 1) for g in sorted(kept))} and swaps the experts on nodes 3 and 5 for the next "
        "best inside the kept nodes: a small cost in quality.",
        "Machines talk over a network and the GPUs inside one machine over far faster links "
        f"({{{{fig:v05-o008}}}}). A token crosses to each target node once, over InfiniBand at {nb('50 GB/s')}, "
        f"then is forwarded inside the node over NVLink at {nb('160 GB/s')}, 3.2 times faster. So at most 4 copies, at one byte a number, cross "
        "between machines per token per layer, instead of up to 8.",
    ])
    emit("p40", at("arranges its 256 experts into eight groups"), "Node-limited routing, worked", y + 32,
         b + [body],
         "The affinities are illustrative; the rule is DeepSeek V3's. Every copy still reaches its expert; "
         "the cap only limits how many cross between machines, and the rest of the delivery rides NVLink.")


def lab2(v):
    return f"{v:.2f}"[1:]


# ---- P41: two microbatches hide each other's waiting ---------------------------------------------------
def p41():
    U = 46
    b = [hd(40, 46, "Two microbatches, A and B, through two layers (schematic, compute = network)")]
    panels = [("one after the other", [("c", "A1", 0), ("n", "A1", 1), ("c", "B1", 2), ("n", "B1", 3),
                                      ("c", "A2", 4), ("n", "A2", 5), ("c", "B2", 6), ("n", "B2", 7)]),
              ("staggered", [("c", "A1", 0), ("n", "A1", 1), ("c", "B1", 1), ("n", "B1", 2), ("c", "A2", 2),
                             ("n", "A2", 3), ("c", "B2", 3), ("n", "B2", 4)])]
    y = 70
    ends = []
    for title, blocks in panels:
        b.append(txt(40, y + 12, title, "sub2"))
        for lab, yy in (("compute", y + 22), ("network", y + 54)):
            b.append(txt(40, yy + 18, lab, "cap"))
            b.append(dashed(130, yy, 8 * U, 26))
        for kind, name, t0 in blocks:
            yy = y + 22 if kind == "c" else y + 54
            b.append(cell(130 + t0 * U, yy, U - 2, 26, "m" if kind == "c" else "h", label=name))
        end = max(t0 for _, _, t0 in blocks) + 1
        ends.append(end)
        b.append(txt(130 + end * U + 8, y + 72, f"{end} units", "sub2"))
        y += 104
    assert ends == [8, 5]
    body, yy = prose(y + 24, [
        "Split the step's tokens into two microbatches. While A's tokens are on the network, B computes; "
        "then they swap. Both lanes stay busy, so two layers' work for both halves takes 5 units instead "
        "of 8, and in the steady state 2 units per layer instead of 4: twice the throughput at a one-to-one "
        "ratio. Microbatches fill a pipeline the same way ({{fig:v05-o012}}), and the hardware lets a "
        "transfer run while arithmetic goes on ({{fig:v03-o072}}).",
        "Every byte is still sent. DeepSeek runs this in prefill, the pass over the prompt "
        "({{fig:v01-o109}}), overlapping one microbatch's attention "
        "and experts with the other's dispatch and combine, and at the time of its report was exploring "
        "the same for decode.",
    ])
    emit("p41", at("The second trick is overlap"), "Two microbatches hide each other's waiting", yy + 32,
         b + [body],
         "Schematic, at the one-to-one ratio. Overlap can hide communication only behind compute that "
         "exists; where the network takes longer than the work, it is still the critical path.")


# ---- P42: a duplicate halves the hottest queue ------------------------------------------------------
LOADS = [40, 20, 18, 16, 14, 12, 10, 6]


def p42():
    after = [LOADS[0] // 2] + LOADS[1:] + [LOADS[0] - LOADS[0] // 2]
    assert max(LOADS) == 40 and max(after) == 20 and sum(after) == sum(LOADS)
    b = [hd(40, 46, "Tokens of work per GPU before and after one copy, to scale")]
    SC = 5.5
    for k, (title, loads, x0) in enumerate([("before", LOADS, 40), ("with a copy on a spare GPU", after, 360)]):
        b.append(txt(x0, 72, title, "sub2"))
        for i, v in enumerate(loads):
            y = 84 + i * 24
            b.append(txt(x0, y + 14, f"GPU {i + 1}", "cap"))
            cl = "h" if v == max(loads) and k == 0 else ("s" if (k == 1 and i in (0, 8)) else "m")
            b.append(rect(x0 + 60, y, v * SC, 18, cl))
            b.append(txt(x0 + 60 + v * SC + 6, y + 14, str(v), "sub2"))
        b.append(txt(x0, 84 + 9 * 24 + 12, f"the layer takes {max(loads)}", "sub2"))
    body, y = prose(84 + 9 * 24 + 56, [
        "The layer waits for its busiest GPU ({{fig:v06-p27}}). Copy GPU 1's hot expert to a spare GPU and "
        "send half its tokens to each copy: 40 becomes 20 + 20, the busiest GPU now carries 20, and the "
        "layer finishes in half the time.",
        "The copy costs one more expert's memory and nothing else; no token is dropped and no traffic "
        "removed, only re-pointed. DeepSeek V3's prefill deployment carries 32 such redundant experts, "
        "chosen from load statistics gathered while serving and re-chosen periodically.",
    ])
    emit("p42", at("The third trick deals with imbalance"), "A duplicate halves the hottest queue", y + 32,
         b + [body],
         "Bars drawn to scale. One expert's worth of memory buys back half the layer: the hottest queue is "
         "where the time goes, so that is where the copy goes.")


if __name__ == "__main__":
    for fn in (p33, o020, p34, p35, p36, p37, p38, p39, o021, p40, p41, p42):
        fn()
