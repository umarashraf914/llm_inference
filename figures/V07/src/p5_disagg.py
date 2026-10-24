"""V7 Part 5, disaggregation: review section G (P28-P35) and the rebuilds of Figs 10 and 11 (o010, o011).

  a31  P28 prefill and decode on opposite sides of one ridge (Llama 3 8B, Part 4's running batch)
  o010     two pools and the cache that crosses between them
  a32  P29 where DistServe's 1.13 GB comes from: OPT-66B's cache, and GQA's 7.2x smaller one
  a33  P30 networks count bits: 12.1 GB/s is 96.6 Gb/s, against three links
  a34  P31 one request's handoff, timed, against one 70B decode step
  a35  P32 attainment: both targets at once is stricter than either
  o011     what disaggregation buys: DistServe and Splitwise, each gain drawn as its own kind
  a36  P33 DeepSeek's 144-GPU decode pool and tokens per expert
  a37  P34 Mooncake: a KV-centric design with a cluster-wide cache pool
  a38  P35 twenty cents per million tokens, worked backwards to the GPU-hour

  python3 figures/V07/src/p5_disagg.py

Sources: DistServe (Zhong et al., OSDI 2024, arXiv 2401.09670): OPT-66B, 512 tokens, "approximately
1.13GB", 10 rps, "11.3GB ... or equivalently 90Gbps", InfiniBand 800 Gbps, A100 NVLink 600 GB/s; 7.4x
more requests or 12.6x tighter SLO with over 90% attainment; OPT-13B, 66B, 175B; chatbot SLOs 0.25 s and
0.1 s for OPT-13B. Splitwise (Patel et al., ISCA 2024, arXiv 2311.18677): 1.4x throughput at 20% lower
cost, or 2.35x at the same cost and power. OPT paper (arXiv 2205.01068) Table 1: OPT-66B 64 layers, 72
heads, d_model 9,216. DeepSeek, "Day 6 ... Inference System Overview" (2025): prefill EP32 over 4 nodes,
decode EP144 over 18 nodes, 32 redundant experts, 9 and 2 routed experts per GPU. DeepSeek-V3 technical
report (arXiv 2412.19437) section 3.4: decode unit of 40 nodes, 320 GPUs. Mooncake (Qin et al., arXiv
2407.00079): Kimi's platform, KVCache-centric, CPU/DRAM/SSD pool, layer-wise streaming, 75% more
requests. LMSYS, "Deploying DeepSeek with PD Disaggregation and Large-Scale Expert Parallelism on 96 H100
GPUs" (May 2025): 12 nodes of 8 H100s, 52.3k input and 22.3k output tokens/s per node at 2,000-token
inputs, about $0.20 per 1M output tokens; the hourly price is not stated. Sarathi-Serve's testbed uses
100 Gbps Ethernet between nodes.
"""
import math
from v07common import *  # noqa: F401,F403

B, CTXD, LP = 32, 1000, 2000                   # Part 4's running batch and prompt


# ---- a31 · P28 ------------------------------------------------------------------------------------
def a31():
    pre = 2 * P8 * LP / W8                                           # weights only: = LP
    c = CTXD * KV8
    dec32 = B * (W8 + 4 * c) / (W8 + B * c)
    dec1 = (W8 + 4 * c) / (W8 + c)
    assert pre == LP and round(dec32, 1) == 26.2 and round(dec1, 2) == 1.02
    A = LogAxes(110, 620, 282, 84, 0.1, 1e4, 1, 1000)
    b = [hd(40, 46, "Llama 3 8B on an H100: one ridge, two workloads, logarithmic axes")]
    b += A.draw([0.1, 1, 10, 100, 1000, 10000], [1, 10, 100, 1000], "operations per byte moved", "TFLOP/s attainable")
    att = lambda i: min(PEAK, BW * i) / 1e12
    b.append(poly([(A.px(1 / (BW / 1e12)), A.py(1)), (A.px(RIDGE), A.py(PEAK / 1e12)), (A.px(1e4), A.py(PEAK / 1e12))], "pl-h"))
    xr = round(A.px(RIDGE), 1)
    b.append(ln(xr, round(A.py(PEAK / 1e12), 1) + 8, xr, A.Y0, "mark"))
    b.append(halo(xr + 8, round(A.py(PEAK / 1e12)) + 26, "ridge, 295"))
    for v, labs, cls, dx, dy, anc in [(pre, [f"prefill, a {fc(LP)}-token prompt: {fc(pre)}"], "m", 0, -14, "middle"),
                                      (dec32, [f"decode, {B}", f"requests: {f(dec32, 1)}"], "h", 10, 18, "start"),
                                      (dec1, ["decode, one request: 1"], "h", 10, 18, "start")]:
        x, y = round(A.px(v), 1), round(A.py(att(v)), 1)
        b.append(dot(x, y, cls))
        for j, lab in enumerate(labs):
            b.append(halo(round(x + dx, 1), round(y + dy + 14 * j, 1), lab, anchor=anc))
    gap = pre / dec32
    body, yb = prose(A.Y0 + 76, [
        f"Prefill processes thousands of prompt tokens at once and saturates the arithmetic units: a "
        f"{fc(LP)}-token prompt uses every weight it reads {fc(LP)} times, about seven times past the ridge "
        "({{fig:v01-o129}}). Decode produces one token per request and leaves the same units starved: even "
        f"Part 4's batch of {B} requests reaches only {f(dec32, 1)} operations per byte, because each brings "
        "its own cache to read ({{fig:v07-a09}}).",
        "Chunked prefill lets the two share one GPU without stalls, but they remain opposite workloads. One "
        "machine means one hardware choice and one way of splitting the model across GPUs for both, which "
        "compromises each.",
    ])
    emit("a31", st("but they remain opposite workloads"), "Prefill and decode sit on opposite sides of the same ridge",
         yb + 32, b + [body],
         f"Same chip, same weights, about {round(gap)} times apart in intensity. Whatever suits one phase "
         "wastes the other.")


# ---- o010 -----------------------------------------------------------------------------------------
def o010():
    b = [hd(40, 46, "Disaggregation: a pool of GPUs for each phase, and a cache that crosses between them")]
    b.append(cell(40, 98, 70, 26, "u", label="prompt"))
    b.append(arr(114, 111, 132, 111))
    b.append(f'<g class="m"><rect x="138" y="66" width="200" height="92" rx="12"/>'
             f'<text class="lbl" x="156" y="88">prefill pool</text></g>')
    for k in range(4):
        b.append(cell(156 + k * 44, 104, 38, 34, "u", label="GPU"))
    b.append(f'<g class="h"><rect x="430" y="66" width="200" height="92" rx="12"/>'
             f'<text class="lbl" x="448" y="88">decode pool</text></g>')
    for k in range(4):
        b.append(cell(448 + k * 44, 104, 38, 34, "u", label="GPU"))
    b.append(arr(344, 111, 424, 111))
    b.append(txt(384, 100, "KV cache", "sub2", "middle"))
    b.append(txt(384, 136, "over the", "sub2", "middle"))
    b.append(txt(384, 150, "interconnect", "sub2", "middle"))
    b.append(txt(430, 180, "then a token per step until the end", "sub2"))
    body, yb = prose(226, [
        "Prefill runs on one pool of GPUs and decode on another, each configured for its own bottleneck: "
        "the prefill pool for arithmetic, the decode pool for memory and batch size. The KV cache the "
        "prefill pool builds is shipped across the interconnect, the links between GPUs and between "
        "machines ({{fig:v02-o093}}), to the decode pool, which carries on from it.",
        "That transfer is the price, and DistServe put a number on it: a single 512-token request on "
        "OPT-66B produces about 1.13 GB of KV cache, so at 10 requests a second the network must carry "
        "roughly 90 gigabits a second just to keep the transfer invisible. The next three figures check "
        "each part of that sentence.",
    ])
    emit("o010", st("Disaggregation gives each its own"), "Disaggregation gives prefill and decode a pool each",
         yb + 32, b + [body],
         "The split buys each phase its own hardware and its own parallelism, at the price of moving every "
         "request's cache once.")


# ---- a32 · P29 ------------------------------------------------------------------------------------
REQ = 512
OPT_REQ = KV_OPT * REQ
L70_REQ = KV70 * REQ


def a32():
    assert OPT_REQ == 1_207_959_552 and round(OPT_REQ / 2**30, 3) == 1.125 and round(OPT_REQ / 1e9, 2) == 1.21
    assert L70_REQ == 167_772_160 and round(KV_OPT / KV70, 1) == 7.2 and 72 * 128 == OPT_D
    b = [hd(40, 46, "OPT-66B: bytes of cache per token, term by term")]
    terms = [("2, K and V", "u", 86), ("64 layers", "u", 80), ("9,216 = 72 × 128", "u", 132), ("2 bytes", "u", 66),
             (f"{fc(KV_OPT)} bytes", "m", 124)]
    x = 40
    for k, (lab, cls, w) in enumerate(terms):
        if k:
            b.append(txt(x - 8, 88, "=" if k == len(terms) - 1 else "×", "sub2", "middle"))
        b.append(eq(x, 66, w, lab, cls, h=34))
        x += w + 16
    assert x - 16 <= 640
    b.append(txt(40, 128, f"× {REQ} tokens = {fc(OPT_REQ)} bytes: 1.21 GB in decimal units, 1.125 GiB in binary ones", "sub2"))
    YB, X0, SC = 178, 230, 380 / OPT_REQ
    b.append(hd(40, YB - 14, f"One {REQ}-token request's cache, to scale"))
    for i, (lab, v, cls) in enumerate([("OPT-66B, 72 KV heads", OPT_REQ, "h"), ("Llama 3 70B, 8 KV heads", L70_REQ, "s")]):
        y = YB + i * 34
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(cell(X0, y, v * SC, 24, cls, rx=2))
        b.append(txt(round(X0 + v * SC + 10, 1), y + 17, f"{f(v / 1e9, 2)} GB" if v > 1e9 else f"{fc(v / 1e6)} MB", "sub2"))
    body, yb = prose(YB + 2 * 34 + 36, [
        "OPT-66B, Meta's 2022 model, keeps a key and a value for each of its 72 attention heads of 128 "
        "numbers, 9,216 per layer, in each of 64 layers: 2 × 64 × 9,216 × 2 bytes = 2,359,296 bytes per "
        f"token. A {REQ}-token request holds {fc(OPT_REQ)} bytes.",
        "That is 1.21 GB in decimal units and 1.125 GiB in binary ones ({{fig:v07-a07}}): DistServe's "
        "“1.13 GB” is the binary figure, rounded.",
        "OPT-66B predates grouped-query attention. Llama 3 70B shares 8 KV heads among its 64 query heads, "
        f"so the same {REQ} tokens hold {fc(L70_REQ / 1e6)} MB, {f(KV_OPT / KV70, 1)} times less "
        "({{fig:v03-o089}}).",
    ])
    emit("a32", st("produces about 1.13 GB"), "Where DistServe's 1.13 GB comes from", yb + 32, b + [body],
         "The handoff's size is the cache formula again. Grouped-query attention, built to save memory, also "
         "shrinks the bill for moving it.")


# ---- a33 · P30 ------------------------------------------------------------------------------------
RATE = 10                                      # requests a second, as DistServe assumes
TRAFFIC = RATE * OPT_REQ                       # bytes a second
LINKS = [("100 Gb/s Ethernet", 100e9 / 8), ("400 Gb/s network port", 400e9 / 8), ("NVLink, H100", 900e9)]


def a33():
    gbps = TRAFFIC * 8 / 1e9
    paper = 1.13 * RATE * 8
    assert round(TRAFFIC / 1e9, 2) == 12.08 and round(gbps, 1) == 96.6 and round(paper, 1) == 90.4
    assert round(gbps / paper - 1, 2) == 0.07
    b = [hd(40, 46, f"{RATE} requests a second, each moving one 1.21 GB cache: the traffic, then three links")]
    b.append(eq(40, 66, 330, f"{RATE} × 1.208 GB = {f(TRAFFIC / 1e9, 2)} GB/s", "u", h=34))
    b.append(txt(386, 88, f"× 8 bits per byte = {f(gbps, 1)} Gb/s", "sub2"))
    X0, W = 230, 330
    b.append(hd(40, 140, "Share of each link this traffic takes"))
    for i, (lab, cap_) in enumerate(LINKS):
        y = 156 + i * 36
        share = TRAFFIC / cap_
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(track(X0, y, W, 24))
        b.append(cell(X0, y, max(share * W, 2), 24, "h", rx=2))
        b.append(txt(round(X0 + W + 10, 1), y + 17, f"{f(share * 100, 1 if share < 0.1 else 0)}%", "sub2"))
    shares = [TRAFFIC / c_ for _, c_ in LINKS]
    assert [round(s_ * 100, 1) for s_ in shares] == [96.6, 24.2, 1.3]
    body, yb = prose(156 + 3 * 36 + 34, [
        "Memory and file sizes are counted in bytes, network links in bits, and a byte is 8 bits "
        "({{fig:v01-o073}}): a link sold as 400 gigabits a second carries 50 gigabytes a second. NVLink "
        "joins the GPUs inside one machine; network ports, InfiniBand or Ethernet, join machines "
        "({{fig:v05-o008}}).",
        f"Ten {REQ}-token OPT-66B requests a second move {RATE} × 1.208 GB = {f(TRAFFIC / 1e9, 2)} GB/s, "
        f"which is {nb(f(gbps, 1) + ' Gb/s')}. DistServe wrote 11.3 GB/s and 90 Gbps by multiplying the binary 1.13 by "
        "10 and by 8; in the decimal units links are sold in, the figure is 7% higher. Said as 90 GB per "
        "second, the unit would be wrong by a factor of 8.",
        "On one 100 Gb/s Ethernet link, the kind Sarathi-Serve's machines used, that traffic alone takes "
        f"{f(shares[0] * 100, 0)}% of the link; on a 400 Gb/s port, {f(shares[1] * 100, 0)}%; over NVLink "
        "inside a node, about 1%.",
    ])
    emit("a33", st("roughly 90 GB per second"), "Networks count bits: 12.1 GB a second is 97 gigabits",
         yb + 32, b + [body],
         "The traffic is the same however it is written. Whether it is a rounding error or the whole pipe "
         "depends on the link.")


# ---- a34 · P31 ------------------------------------------------------------------------------------
def a34():
    T_STEP70 = t_read(W70)
    rows = [("a 70B decode step, for scale", T_STEP70, "u", ""),
            ("OPT-66B, 400 Gb/s port", OPT_REQ / (400e9 / 8), "h", ""),
            ("Llama 3 70B, 400 Gb/s port", L70_REQ / (400e9 / 8), "s", ""),
            ("OPT-66B, NVLink", OPT_REQ / 900e9, "s", "")]
    assert [round(t * 1e3, 2) for _, t, _, _ in rows] == [41.79, 24.16, 3.36, 1.34]
    b = [hd(40, 46, f"Time to move one {REQ}-token request's cache, to scale")]
    X0, SC = 250, 340 / T_STEP70
    for i, (lab, t, cls, note) in enumerate(rows):
        y = 70 + i * 34
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(cell(X0, y, max(t * SC, 2), 24, cls, rx=2) if cls != "u" else ghost(X0, y, t * SC, 24))
        b.append(txt(round(X0 + t * SC + 10, 1), y + 17, f"{f(t * 1e3, 2 if t < 0.01 else 1)} ms" + (f"  {note}" if note else ""), "sub2"))
    body, yb = prose(70 + 4 * 34 + 30, [
        f"Each request's cache crosses once, between its prefill and its first decode step. Over a 400 Gb/s "
        f"port OPT-66B's 1.21 GB takes {f(rows[1][1] * 1e3, 1)} ms; over NVLink's 900 GB/s, "
        f"{f(rows[3][1] * 1e3, 2)} ms. Llama 3 70B's {fc(L70_REQ / 1e6)} MB takes {f(rows[2][1] * 1e3, 1)} ms "
        "even over the network.",
        "That time is added to the request's time to first token. It can also be hidden: Mooncake streams a "
        "prefill's cache out layer by layer while the later layers are still computing.",
        "A cluster with InfiniBand or NVLink absorbs that. A small deployment does not, which makes "
        "disaggregation a decision about how much traffic you have, not a default.",
    ])
    emit("a34", st("A cluster with InfiniBand"), "One request's handoff takes 1 to 24 milliseconds, depending on the link",
         yb + 32, b + [body],
         "Fast links make the transfer a rounding error and slow ones make it the bottleneck. Disaggregation "
         "is only as good as the wire between the pools.")


# ---- a35 · P32 ------------------------------------------------------------------------------------
TTFT_T, TPOT_T = 250, 100                       # ms: DistServe's chatbot targets for OPT-13B
REQS = [(180, 62), (210, 85), (140, 71), (900, 58), (230, 64), (160, 130), (195, 77), (120, 92), (240, 68), (175, 83)]


def a35():
    ok1 = [a <= TTFT_T for a, _ in REQS]
    ok2 = [p <= TPOT_T for _, p in REQS]
    both = [x and y for x, y in zip(ok1, ok2)]
    assert sum(ok1) == 9 and sum(ok2) == 9 and sum(both) == 8 and not ok1[3] and not ok2[5]
    b = [hd(40, 46, f"Ten requests, two targets: first token within {TTFT_T} ms, later ones within {TPOT_T} ms each")]
    X = [92, 210, 280, 410, 480, 590]
    for x, h_ in zip(X, ["request", "TTFT, ms", "", "TPOT, ms", "", "both"]):
        if h_:
            b.append(txt(x, 78, h_, "sub2", "end"))
    for i, ((a, p), o1, o2, ob) in enumerate(zip(REQS, ok1, ok2, both)):
        y = 86 + i * 22
        b.append(txt(X[0], y + 14, str(i + 1), "cap", "end"))
        b.append(txt(X[1], y + 14, str(a), "sub2", "end"))
        b.append(cell(X[2] - 22, y + 2, 22, 16, "s" if o1 else "h", rx=2, label="✓" if o1 else "✗"))
        b.append(txt(X[3], y + 14, str(p), "sub2", "end"))
        b.append(cell(X[4] - 22, y + 2, 22, 16, "s" if o2 else "h", rx=2, label="✓" if o2 else "✗"))
        b.append(cell(X[5] - 22, y + 2, 22, 16, "s" if ob else "h", rx=2, label="✓" if ob else "✗"))
    yt = 86 + 10 * 22 + 8
    b.append(ln(40, yt, 600, yt, "axis"))
    b.append(txt(X[0], yt + 18, "met", "sub2", "end"))
    b.append(txt(X[2], yt + 18, f"{sum(ok1)} of 10", "sub2", "end"))
    b.append(txt(X[4], yt + 18, f"{sum(ok2)} of 10", "sub2", "end"))
    b.append(txt(X[5], yt + 18, f"{sum(both)} of 10", "sub2", "end"))
    body, yb = prose(yt + 58, [
        "DistServe judges a deployment by attainment: the share of requests that meet both their latency "
        "targets at once, the time to first token and the time per output token ({{fig:v07-a02}}). The "
        "targets here are its chatbot settings for OPT-13B; the ten requests are illustrative.",
        "Each target alone is met by 9 of the 10, 90%. Both together only by 8: request 4 waited too long "
        "for its first token and request 6 got its tokens too slowly. Attainment is 80%, not 90%.",
        "DistServe's results count requests served per GPU while attainment stays above 90%.",
    ])
    emit("a35", st("were concurrent independent research"), "Inside both budgets means both at once",
         yb + 32, b + [body],
         "An AND of two conditions is stricter than either alone. Reported one target at a time, the same "
         "system would look better than it is.")


# ---- o011 -----------------------------------------------------------------------------------------
def o011():
    b = [hd(40, 46, "Two kinds of gain, each drawn to its own scale")]
    X0 = 260
    b.append(txt(40, 76, "DistServe, against systems serving both phases on the same GPUs", "sub2"))
    rows = [("requests per GPU", 1, 7.4, "up to 7.4 times more", 50),
            ("tightest targets met", 1, 1 / 12.6, "up to 12.6 times tighter", 50 * 7.4)]
    for i, (lab, base, v, val, sc) in enumerate(rows):
        y = 88 + i * 58
        b.append(txt(40, y + 14, lab, "cap"))
        if sc * base > 100:
            b.append(ghost(X0, y, sc * base, 18, label="before"))
        else:
            b.append(cell(X0, y, sc * base, 18, "u", rx=2))
            b.append(txt(round(X0 + sc * base + 8, 1), y + 14, "before", "sub2"))
        if sc * v > 160:
            b.append(cell(X0, y + 24, sc * v, 18, "s", rx=2, label=val))
        else:
            b.append(cell(X0, y + 24, max(sc * v, 2), 18, "s", rx=2))
            b.append(txt(round(X0 + sc * v + 8, 1), y + 38, val, "sub2"))
    assert round(50 * 7.4) == 370 and round(370 / 12.6, 1) == 29.4
    ys = 88 + 2 * 58 + 18
    b.append(txt(40, ys, "Splitwise, throughput per dollar against an ordinary cluster", "sub2"))
    per_dollar = 1.4 / 0.8
    assert round(per_dollar, 2) == 1.75
    for i, (lab, v, val) in enumerate([("1.4× throughput, 20% cheaper", per_dollar, f"{f(per_dollar, 2)}× per dollar"),
                                        ("same cost and power", 2.35, "2.35× per dollar")]):
        y = ys + 12 + i * 30
        b.append(txt(40, y + 14, lab, "cap"))
        b.append(cell(X0, y, v * 140, 18, "s", rx=2, label=val))
    body, yb = prose(ys + 12 + 2 * 30 + 34, [
        "DistServe (Peking University and UC San Diego) and Splitwise (University of Washington and "
        "Microsoft) were concurrent, independent work that reached the same conclusion.",
        "DistServe reported serving up to 7.4 times more requests, or meeting targets up to 12.6 times "
        "tighter, while keeping over 90% of requests inside both budgets, on OPT models from 13 to 175 "
        "billion parameters. More requests make a longer bar; a tighter target makes a shorter one.",
        "Splitwise reported 1.4 times the throughput at 20% lower cost, which is 1.4 ÷ 0.8 = 1.75 times "
        "the throughput per dollar, or 2.35 times at the same cost and power.",
    ])
    emit("o011", st("reported serving 7.4 times"), "What disaggregation buys", yb + 32, b + [body],
         "Two independent groups reached the same split at the same time, usually a sign the constraint is "
         "real rather than an artefact of one system.")


# ---- a36 · P33 ------------------------------------------------------------------------------------
EXPERTS, ACTIVE, REDUNDANT = 256, 8, 32
PER_GPU = 64                                    # requests decoding on one GPU: illustrative


def a36():
    per_expert = lambda n: n * ACTIVE / EXPERTS
    rows = [("one GPU's requests", PER_GPU), ("one node of 8 GPUs", 8 * PER_GPU), ("the 144-GPU decode pool", 144 * PER_GPU)]
    vals = [per_expert(n) for _, n in rows]
    assert vals == [2, 16, 288] and (EXPERTS + REDUNDANT) / 144 == 2 and (EXPERTS + REDUNDANT) / 32 == 9
    b = [hd(40, 46, "Tokens each expert gets per decode step, logarithmic scale")]
    X0, X1 = 250, 600
    lx = lambda v: X0 + math.log10(v) / math.log10(1000) * (X1 - X0)
    for i, ((lab, n), v) in enumerate(zip(rows, vals)):
        y = 70 + i * 34
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(cell(X0, y, round(lx(v) - X0, 1), 24, "s" if v > 100 else "h", rx=2))
        b.append(txt(round(lx(v) + 10, 1), y + 17, f"{fc(n)} × 8 ÷ 256 = {fc(v)}", "sub2"))
    ya = 70 + 3 * 34 + 6
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v in (1, 10, 100, 1000):
        b.append(tick(lx(v), ya, lx(v), ya + 5))
        b.append(txt(round(lx(v), 1), ya + 19, fc(v), "sub2", "middle"))
    xr = round(lx(RIDGE), 1)
    b.append(f'<line class="mark xok" x1="{xr}" y1="64" x2="{xr}" y2="{ya}"/>')
    b.append(txt(xr + 6, ya + 36, f"ridge, about {round(RIDGE)}", "sub2", "middle"))
    body, yb = prose(ya + 78, [
        "DeepSeek runs its prefill pool at 32-way expert parallelism and its decode pool at 144-way: the "
        "experts are spread over the pool's GPUs, and every token is shipped to the GPUs holding its 8 "
        "chosen experts ({{fig:v05-o016}}).",
        "The reason is sparsity. In decode each request adds one token per step, and each expert sees the "
        f"combined batch × 8 ÷ 256 tokens. If each decode GPU runs {PER_GPU} requests (illustrative), one "
        f"GPU's batch gives each expert 2 tokens; the whole pool's {fc(144 * PER_GPU)} give 288, close to "
        "the 295 at which an expert's arithmetic keeps pace with reading its weights, in FP8, 8-bit "
        "numbers of one byte each, as in 16 bits ({{fig:v07-a01}}).",
        "DeepSeek's 2025 overview of its production system puts 2 routed experts on each of the 144 decode "
        "GPUs, (256 + 32 redundant copies of busy experts) ÷ 144, and 9 on each of the 32 prefill GPUs. "
        "Its V3 technical report of December 2024 described a decode unit of 320 GPUs, one expert each: the "
        "deployment in {{fig:v06-o019}}.",
    ])
    emit("a36", st("DeepSeek runs its prefill pool"), "A decode pool of 144 GPUs gives every expert a real batch",
         yb + 32, b + [body],
         "Decode is where the crowd has to be assembled, because each request brings one token per step. "
         "Pooling 144 GPUs' requests is how 8-of-256 sparsity gets fed.")


# ---- a37 · P34 ------------------------------------------------------------------------------------
def a37():
    b = [hd(40, 46, "Mooncake: caches kept in a pool built from every node's spare memory")]
    b.append(f'<g class="u"><rect x="40" y="62" width="600" height="196" rx="14"/>'
             f'<text class="lbl" x="62" y="86">the cluster</text></g>')
    nodes = [("prefill node", "m", 62), ("prefill node", "m", 254), ("decode node", "h", 446)]
    for lab, cls, x in nodes:
        b.append(f'<g class="{cls}"><rect x="{x}" y="100" width="172" height="104" rx="10"/>'
                 f'<text class="lbl" x="{x + 16}" y="122">{esc(lab)}</text></g>')
        b.append(cell(x + 16, 134, 140, 20, "u", rx=3, label="GPU memory"))
        b.append(cell(x + 16, 160, 66, 20, "s", rx=3, label="DRAM"))
        b.append(cell(x + 90, 160, 66, 20, "s", rx=3, label="SSD"))
    b.append(txt(62, 238, "green: the shared KV cache pool, any node's prefix available to every prefill", "sub2"))
    body, yb = prose(300, [
        "Mooncake, the serving platform behind Kimi (Moonshot AI and Tsinghua University, 2024), built its "
        "whole architecture around the KV cache. Besides splitting prefill from decode, it gathers the "
        "cluster's otherwise idle CPU memory (DRAM) and solid-state drives (SSD) into one store of caches.",
        "A prefix's cache, once computed, is kept there and fetched by whichever prefill node takes the next "
        "request that shares it, and a finished prefill streams its cache to the decode node layer by layer. "
        "The scheduler sends each request where most of its cache already sits.",
        "Under real workloads, its paper reports, this let Kimi handle 75% more requests.",
    ])
    emit("a37", st("the platform behind Kimi"), "Mooncake keeps the cache in a pool that outlives any one GPU",
         yb + 32, b + [body],
         "Once the cache is the thing being moved, it can also be kept. A KV-centric design treats prefill's "
         "output as an asset to store and reuse, not a by-product.")


# ---- a38 · P35 ------------------------------------------------------------------------------------
def a38():
    out_node, gpus, price = 22_300, 8, 0.20
    per_gpu = out_node / gpus
    per_hour = per_gpu * 3600
    implied = price * per_hour / 1e6
    assert per_gpu == 2787.5 and round(per_hour / 1e6, 2) == 10.04 and round(implied, 2) == 2.01
    b = [hd(40, 46, "From the reported throughput and cost to the hourly price behind them")]
    steps = [(f"{fc(out_node)} tokens/s per node ÷ {gpus} GPUs", f"= {fc(per_gpu, 1)} tokens/s per GPU"),
             (f"× 3,600 seconds", f"= {f(per_hour / 1e6, 2)} million tokens per GPU-hour"),
             (f"× ${f(price, 2)} per million tokens", f"= ${f(implied, 2)} per GPU-hour")]
    for i, (e, r) in enumerate(steps):
        y = 66 + i * 50
        b.append(eq(40, y, 290, e, "m" if i == 2 else "u", h=34))
        b.append(txt(346, y + 22, r, "sub2"))
    body, yb = prose(66 + 3 * 50 + 30, [
        "By 2025 the pattern was standard. NVIDIA Dynamo and llm-d coordinate prefill and decode pools "
        "across machines; llm-d runs natively on Kubernetes, the common system for running programs across "
        f"a fleet of machines. SGLang's team reproduced DeepSeek's design on {nb('96 H100s')}, 12 nodes of 8, and "
        "sustained 52,300 input and 22,300 output tokens a second per node on 2,000-token inputs.",
        "Its write-up puts the cost at about $0.20 per million output tokens without stating the hourly "
        "price behind it. Working back from its own numbers gives about $2 per GPU-hour, the price of "
        "renting one GPU for one hour, counting the decode GPUs alone.",
        "Turned around, the same division prices any deployment: dollars per GPU-hour ÷ millions of tokens "
        "per GPU-hour = dollars per million tokens.",
    ])
    emit("a38", st("by 2025, the pattern was standard"), "Twenty cents per million tokens is one division",
         yb + 32, b + [body],
         "Every efficiency in this document ends here: more tokens per GPU-hour divides the same hourly "
         "price into a smaller cost per token.")


if __name__ == "__main__":
    for fn in (a31, o010, a32, a33, a34, a35, o011, a36, a37, a38):
        fn()
