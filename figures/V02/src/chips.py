"""V2 Part 14, many chips: review proposals 32-35, Fig 95 redrawn per direction, and the "order of
magnitude" and "tenfold" claims of Figs 92-96 corrected (review §5a.3, §5a.19).

  python3 figures/V02/src/chips.py     writes p32 p33 p34 p35 o095; edits o091 o092 o093 o094 o096 o097

Sources read for this Part, beyond common.py's:
  NVLP    nvidia.com NVLink page: NVLink bandwidth per GPU 900 / 1,800 / 3,000 GB/s for the fourth,
          fifth and sixth generations, 18 / 18 / 36 links; the sixth's 3 TB/s is called
          "bidirectional"; switches give "all-to-all GPU communication at full NVLink speed"
  Q2      nvidia.com Quantum-2 InfiniBand page: "400Gb/s bandwidth per port", "64 400Gb/s ports",
          "an aggregated 51.2 terabits per second (Tb/s) of bidirectional throughput"
  LLAMA3  Llama 3 paper: 405B parameters, 126 layers; the 70B has 80 layers (its Table 3)
  WP104   (as in common.py) NVLink: "fourth-generation NVLink uses only two high-speed differential
          pairs in each direction to form a single link, also delivering 25 GB/sec effective bandwidth
          in each direction"; A100: four pairs, 25 GB/s each way, 12 links, 600 GB/s total; the DGX
          H100's eight GPUs "interconnect through four third-generation NVSwitches"
"""
import math
from common import *  # noqa: F401,F403
from atlas import brace  # noqa: E402

# ---- links, per direction --------------------------------------------------------------------------
NVL = {"A100": (12, 25e9), "H100": (NVLINK_LINKS, NVLINK_LINK_DIR)}       # links, bytes/s each way per link
NVL_EACH = {k: n_ * r for k, (n_, r) in NVL.items()}
NVL_EACH["B200"] = B200["nvlink"] / 2                                       # NVLP: per-GPU figures count both ways
NVL_TOTAL = {k: 2 * v for k, v in NVL_EACH.items()}
assert NVL_TOTAL == {"A100": 600e9, "H100": NVLINK_TOTAL, "B200": 1.8e12} and NVL_EACH["H100"] == 450e9
PAIR_GBIT = NVLINK_LINK_DIR / NVLINK_PAIRS_DIR * 8 / 1e9
assert PAIR_GBIT == 100 and NVLINK_LINKS * NVLINK_PAIRS_DIR * PAIR_GBIT / 8 == 450
PAIRS_ALL = NVLINK_LINKS * NVLINK_PAIRS_DIR * 2                             # both directions
assert PAIRS_ALL == 72
HBM_PIN_GBIT = 2 * HBM_DDR_MHZ / 1e3                                        # two transfers a clock
assert round(HBM_PIN_GBIT, 3) == 5.238 and round(HBM_BITS * HBM_PIN_GBIT / 8) == round(HBM_BW / 1e9) == 3352
IB_EACH = IB_GBIT / 8 * 1e9                                                 # Q2: 400 Gb/s a port, each way
assert 64 * IB_GBIT * 2 == 51_200 and IB_EACH == 50e9
STEP1, STEP2 = HBM_BW / NVL_EACH["H100"], NVL_EACH["H100"] / IB_EACH
assert round(STEP1, 1) == 7.4 and STEP2 == 9 and round(HBM_BW / NVLINK_TOTAL, 1) == 3.7
HBM_GEN = {"A100": A100["bw"], "H100": HBM_BW, "B200": B200["bw"]}
R_EACH = {k: HBM_GEN[k] / NVL_EACH[k] for k in HBM_GEN}
R_TOTAL = {k: HBM_GEN[k] / NVL_TOTAL[k] for k in HBM_GEN}
assert [round(v, 1) for v in R_EACH.values()] == [6.8, 7.4, 8.9]
assert [round(v, 1) for v in R_TOTAL.values()] == [3.4, 3.7, 4.4]
assert NVL_TOTAL["B200"] / NVL_TOTAL["A100"] == 3

# ---- capacity ------------------------------------------------------------------------------------------
P405, L70 = 405e9, 80
W16, W8 = P405 * 2, P405 * 1
NVL72_TB = 13.4                                                              # NVL72: "13.4 TB HBM3E"
assert W16 == 810e9 and math.ceil(W16 / (HBM_GB * 1e9)) == 11 and W16 / (HBM_GB * 1e9) == 10.125
assert 8 * HBM_GB == 640 and W16 > 640e9 >= W8 and 640 - 405 == 235
assert NVL72_TB * 1e12 / W16 > 16 and round(NVL72_TB * 1e12 / W16, 1) == 16.5

# ---- tensor parallelism ----------------------------------------------------------------------------------
TPW = [2, 1, 3, 1, 1, 2, 2, 1]
TPX = [1, 2, 1, 3, 2, 1, 1, 2]
PA = sum(w * x for w, x in zip(TPW[:4], TPX[:4]))
PB = sum(w * x for w, x in zip(TPW[4:], TPX[4:]))
assert (PA, PB, PA + PB) == (10, 8, 18) == (PA, PB, sum(w * x for w, x in zip(TPW, TPX)))
AR_PER_LAYER = 2                                                             # MEG: two all-reduces, forward
assert AR_PER_LAYER * L70 == 160


def links(n_):
    return n_ * (n_ - 1) // 2


assert [links(k) for k in (4, 8, 72)] == [6, 28, 2556]


# ---- p32 ---------------------------------------------------------------------------------------------------
def p32():
    S, X0 = 0.5, 190                       # px per GB
    b = [hd(40, 46, "Llama 3's 405B weights against H100 memory, in gigabytes (to scale)")]
    rows = [("weights at 16 bits", "405 billion × 2 bytes", W16, "h"),
            ("weights at 8 bits", "405 billion × 1 byte", W8, "m")]
    for k, (lab, sub, v, c) in enumerate(rows):
        y = 64 + k * 50
        b.append(txt(40, y + 14, lab, "cap"))
        b.append(txt(40, y + 31, sub, "sub2"))
        b.append(cell(X0, y, v / 1e9 * S, 28, c, rx=3, label=f"{v / 1e9:,.0f} GB"))
    y3 = 64 + 2 * 50 + 10
    b.append(txt(40, y3 + 14, "H100s, 80 GB each", "cap"))
    b.append(txt(40, y3 + 31, "eight to a box", "sub2"))
    cw = HBM_GB * S
    for i in range(11):
        b.append(cell(X0 + i * cw, y3, cw, 28, "s" if i < 8 else "u", rx=0, label=f"{i + 1}"))
    xm = X0 + W16 / 1e9 * S
    b.append(ln(round(xm, 1), 58, round(xm, 1), y3 + 34, "mark xok"))
    b.append(brace(X0, X0 + 8 * cw, y3 + 40, "one box of eight: 640 GB"))
    b.append(brace(X0 + 8 * cw + 2, X0 + 11 * cw, y3 + 40, "a second box"))
    body, yb = prose(y3 + 40 + 22 + 44, [
        "Weights take parameters × bytes each ({fig}). Llama 3's largest model has 405 billion parameters, "
        "so at 16 bits its weights are 810 GB: ten full H100s and part of an eleventh, before any memory "
        "for the work itself.".replace("{fig}", "{{fig:v01-o073}}"),
        "A box of eight H100s holds 640 GB, so at 16 bits the model spills into a second box, and whatever "
        "passes between the two goes over the network. At 8 bits the weights are 405 GB and fit in one "
        "box, with 235 GB to spare.",
        f"A GB200 NVL72 rack holds {NVL72_TB} TB of HBM in one NVLink domain, more than sixteen times the "
        "16-bit weights.",
    ])
    emit("p32", stamp(SRT, "gets split across many GPUs"),
         "A 405-billion-parameter model at 16 bits needs eleven H100s before it does anything", yb + 24,
         b + [body],
         "Bars and boxes to scale; the dashed line is 810 GB. Parameter count from the Llama 3 paper, the "
         "rack's memory from NVIDIA's GB200 NVL72 specifications. Serving needs memory beyond the "
         "weights, so these counts are a floor.")


# ---- p33 ---------------------------------------------------------------------------------------------------
def p33():
    b = [hd(40, 46, "Eight GPUs, wired in pairs or through a switch")]
    R, NW, NH = 82, 30, 22
    pos = lambda cx, cy, k: (cx + R * math.cos(math.radians(-90 + 45 * k)),
                             cy + R * math.sin(math.radians(-90 + 45 * k)))
    L, Rc, CY = (180, 166), (500, 166), 166
    pts = [pos(L[0], CY, k) for k in range(8)]
    for i in range(8):
        for j in range(i + 1, 8):
            b.append(ln(round(pts[i][0], 1), round(pts[i][1], 1), round(pts[j][0], 1), round(pts[j][1], 1), "conn"))
    assert sum(1 for i in range(8) for j in range(i + 1, 8)) == links(8)
    sp = [pos(Rc[0], CY, k) for k in range(8)]
    for x, y in sp:
        b.append(ln(Rc[0], CY, round(x, 1), round(y, 1), "conn"))
    for k, (x, y) in enumerate(pts + sp):
        b.append(cell(round(x - NW / 2, 1), round(y - NH / 2, 1), NW, NH, "m", rx=3, label=f"{k % 8 + 1}"))
    b.append(cell(Rc[0] - 34, CY - 15, 68, 30, "s", rx=4, label="switch"))
    yl = CY + R + NH / 2 + 30
    for cx, l1, l2 in [(L[0], "wired in pairs: 28 links", "each GPU's links split seven ways"),
                       (Rc[0], "through a switch: 8 connections", "any pair at the full rate")]:
        b.append(txt(cx, yl, l1, "cap", "middle"))
        b.append(txt(cx, yl + 17, l2, "sub2", "middle"))
    ye = yl + 17 + 22
    b.append(eq(40, ye, 600, f"links to join every pair  =  n(n − 1) ÷ 2:   {links(4)} for 4 GPUs,  "
                             f"{links(8)} for 8,  {links(72):,} for 72", cls="m"))
    body, yb = prose(ye + 42 + 36, [
        "Joining every pair of n GPUs directly takes n(n − 1) ÷ 2 links: each GPU pairs with the n − 1 "
        f"others, and each link has two ends. That is {links(4)} for 4 GPUs, {links(8)} for 8 and "
        f"{links(72):,} for 72.",
        f"And a GPU's links are a fixed budget, {NVLINK_LINKS} on the H100, so in a mesh of eight each pair "
        "gets only about a seventh of them, and a GPU sending to one neighbour leaves most of its links "
        "idle.",
        "A switch turns this around. Every GPU runs all its links to the switch, which connects any pair "
        "at the full rate, and the connections grow with the number of GPUs rather than with the number "
        "of pairs. In the DGX H100 the eight GPUs meet in four NVSwitch chips.",
    ])
    emit("p33", stamp(SRT, "crossbar called"), "Wiring every pair stops scaling; a switch gives each GPU one connection",
         yb + 24, b + [body],
         "Drawn as one switch; the DGX H100 spreads each GPU's 18 links over four switch chips (H100 "
         "whitepaper). NVIDIA describes its switches as giving all-to-all communication at full NVLink "
         "speed.")


# ---- o095 ---------------------------------------------------------------------------------------------------
def o095():
    S, X0 = 400 / 8000, 170                     # px per GB/s
    b = [hd(40, 46, "Each GPU's own memory against its NVLink, each way, in GB/s (to scale)")]
    gens = [("A100", "2020"), ("H100", "2022"), ("B200", "2024")]
    for k, (g, yr) in enumerate(gens):
        y = 64 + k * 74
        b.append(txt(40, y + 16, g, "cap"))
        b.append(txt(40, y + 33, yr, "sub2"))
        hb, nv = HBM_GEN[g] / 1e9, NVL_EACH[g] / 1e9
        b.append(rect(X0, y, hb * S, 22, "s"))
        b.append(txt(round(X0 + hb * S + 8, 1), y + 16, f"HBM {hb:,.0f}", "sub2"))
        b.append(rect(X0, y + 28, nv * S, 22, "m"))
        b.append(txt(round(X0 + nv * S + 8, 1), y + 44,
                     f"NVLink {nv:,.0f} each way, {2 * nv:,.0f} both: HBM is {R_EACH[g]:.1f}× faster", "sub2"))
    body, yb = prose(64 + 3 * 74 + 20, [
        "NVLink per GPU has tripled in two generations: 600 GB/s on the A100, 900 on the H100, 1.8 TB/s on "
        "Blackwell. Those quoted figures add both directions; each way it is 300, 450 and 900.",
        "HBM grew as well, so the gap has held: a GPU reads its own memory "
        f"{R_EACH['A100']:.1f}, {R_EACH['H100']:.1f} and {R_EACH['B200']:.1f} times faster than it can receive "
        f"from a neighbour, or {R_TOTAL['A100']:.1f}, {R_TOTAL['H100']:.1f} and {R_TOTAL['B200']:.1f} times "
        "against the quoted two-way figures. Not an order of magnitude, but enough that moving data between "
        "GPUs is never free.",
    ])
    emit("o095", stamp(SRT, "NVLink is fast and keeps"), "NVLink is not standing still", yb + 24, b + [body],
         "Bars to scale. HBM from the A100 80 GB datasheet, the H100 whitepaper and the DGX B200 "
         "specifications; NVLink from the H100 whitepaper and NVIDIA's NVLink page, whose per-GPU figures "
         "count both directions.")


# ---- p34 ---------------------------------------------------------------------------------------------------
def p34():
    b = [hd(40, 46, "Bytes a second  =  wires × bits a second on each  ÷  8 bits a byte")]
    rows = [f"HBM:   {HBM_BITS:,} wires × {HBM_PIN_GBIT:.3f} Gb/s  =  {HBM_BITS * HBM_PIN_GBIT:,.0f} Gb/s   →   "
            f"{HBM_BW / 1e9:,.0f} GB/s",
            f"NVLink:   {NVLINK_LINKS} links × {NVLINK_PAIRS_DIR} pairs × {PAIR_GBIT:.0f} Gb/s  =  "
            f"{NVLINK_LINKS * NVLINK_PAIRS_DIR * PAIR_GBIT:,.0f} Gb/s   →   {NVL_EACH['H100'] / 1e9:.0f} GB/s each way",
            f"InfiniBand:   one {IB_GBIT} Gb/s port per GPU   →   {IB_EACH / 1e9:.0f} GB/s each way"]
    for k, s_ in enumerate(rows):
        b.append(eq(40, 62 + k * 42, 600, s_, h=34))
    X0, X1, V0, V1 = 210, 610, 10, 10000
    lx = lambda v: logx(v, V0, V1, X0, X1)
    bars = [("HBM, its own memory", HBM_BW / 1e9, "s", f"{HBM_BW / 1e9:,.0f} GB/s"),
            ("NVLink, a neighbour", NVL_EACH["H100"] / 1e9, "m", f"{NVL_EACH['H100'] / 1e9:.0f} GB/s each way: "
                                                                  f"{STEP1:.1f}× less"),
            ("InfiniBand, the network", IB_EACH / 1e9, "h", f"{IB_EACH / 1e9:.0f} GB/s each way: {STEP2:.0f}× less")]
    yb0 = 62 + 3 * 42 + 26
    for k, (lab, v, c, note) in enumerate(bars):
        y = yb0 + k * 34
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(rect(X0, y, lx(v) - X0, 24, c))
        b.append(txt(round(lx(v) + 8, 1), y + 17, note, "sub2"))
    ax = yb0 + 3 * 34 + 2
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v in (10, 100, 1000, 10000):
        b.append(vline(lx(v), ax, ax + 5))
        b.append(txt(round(lx(v), 1), ax + 19, f"{v:,}", "sub2", "middle"))
    b.append(txt(X1, ax + 38, "GB/s (log)", "sub2", "end"))
    body, yb = prose(ax + 38 + 40, [
        "Each link is wires times the rate on each wire, the arithmetic of any bus ({fig}). Link rates are "
        "quoted in gigabits a second; dividing by 8 gives gigabytes.".replace("{fig}", "{{fig:v01-o074}}"),
        "NVLink's quoted 900 GB/s adds its two directions; one way it carries 450. InfiniBand's 400 Gb/s is "
        "one way, as NVIDIA's own switch figures show: its 64 ports of 400 Gb/s make the 51.2 Tb/s it "
        "quotes for both directions.",
        f"Per direction, then, each step out is {STEP1:.1f} times and then {STEP2:.0f} times slower. NVLink "
        f"is not an order of magnitude behind memory, {HBM_BW / NVLINK_TOTAL:.1f} times against its quoted "
        "900, but the network is close to an order of magnitude behind NVLink.",
    ])
    emit("p34", stamp(SRT, "roughly an order of magnitude slower"),
         "Three links, each wires × rate, in the same units", yb + 24, b + [body],
         "Log axis, three powers of ten. HBM's width and clock and NVLink's 25 GB/s each way over two wire "
         "pairs per link are from the H100 whitepaper; the port rate from NVIDIA's Quantum-2 InfiniBand "
         "specifications.")


# ---- p35 ---------------------------------------------------------------------------------------------------
def p35():
    b = [hd(40, 46, "One output of a layer, a sum of eight terms, split across two GPUs")]
    X0, P, W, GAP = 190, 46, 40, 20
    cx = lambda i: X0 + i * P + (GAP if i >= 4 else 0)
    for r, (lab, vec, c) in enumerate([("weights w", TPW, "s"), ("inputs x", TPX, "u")]):
        y = 62 + r * 34
        b.append(txt(40, y + 18, lab, "cap"))
        for i, v in enumerate(vec):
            b.append(cell(cx(i), y, W, 26, c, rx=3, label=f"{v}"))
    terms = lambda lo: " + ".join(f"{w}×{x}" for w, x in zip(TPW[lo:lo + 4], TPX[lo:lo + 4]))
    ya = 62 + 2 * 34 + 14
    A, B_ = (150, 225), (395, 225)
    b.append(box(A[0], ya, A[1], 56, "m", "GPU A", f"{terms(0)} = {PA}"))
    b.append(box(B_[0], ya, B_[1], 56, "m", "GPU B", f"{terms(4)} = {PB}"))
    yr = ya + 56 + 46
    ma, mb = A[0] + A[1] / 2, B_[0] + B_[1] / 2
    b.append(arr(ma, ya + 60, mb - 30, yr - 4))
    b.append(arr(mb, ya + 60, ma + 30, yr - 4))
    b.append(txt(40, ya + 56 + 27, "partial sums cross", "cap"))
    b.append(txt(40, ya + 56 + 44, "the link", "cap"))
    b.append(cell(A[0], yr, A[1], 30, "s", rx=4, label=f"GPU A:  {PA} + {PB} = {PA + PB}"))
    b.append(cell(B_[0], yr, B_[1], 30, "s", rx=4, label=f"GPU B:  {PB} + {PA} = {PA + PB}"))
    ye = yr + 30 + 24
    b.append(eq(40, ye, 600, f"{AR_PER_LAYER} all-reduces a layer  ×  {L70} layers  =  {AR_PER_LAYER * L70} "
                             "every token", cls="m"))
    body, yb = prose(ye + 42 + 36, [
        "Tensor parallelism splits each layer's weights across GPUs. Every output is a dot product, a sum "
        "of weight × input terms ({fig}), and with the weights split, each GPU can add up only its own "
        "share of the terms.".replace("{fig}", "{{fig:v01-o111}}"),
        "Before the next layer can start, the shares must meet: each GPU sends its partial sum and each "
        "ends with the total. The exchange is called an all-reduce, and Megatron-LM's split needs two per "
        "layer, one after the attention block and one after the feed-forward block.",
        f"For an {L70}-layer model such as Llama 3 70B that is {AR_PER_LAYER * L70} all-reduces for every "
        "token, each one a wait on the link. That frequency is why the link's speed matters so much.",
    ])
    emit("p35", stamp(SRT, "Tensor parallelism splits"),
         "Split a sum across two GPUs, and the halves must meet before the next layer", yb + 24, b + [body],
         "Numbers small enough to check by hand. Two all-reduces per layer in the forward pass is from the "
         "Megatron-LM paper, the layer count from the Llama 3 paper; the fifth atlas, on parallelism, "
         "builds the whole scheme.")


# ---- edits ---------------------------------------------------------------------------------------------
def fixes():
    edit_item("o091", replace=[
        ('dominant-baseline="central">80 GB</text>', 'dominant-baseline="central">H100: 80 GB</text>'),
        ('dominant-baseline="central">140 GB</text>', 'dominant-baseline="central">H200: 141 GB</text>'),
    ], caption="Capacity and bandwidth are independent failure modes with different remedies ({{ref:v01-o080}}). "
               "The weights bar is schematic; the next figure puts a real model to scale.")
    edit_item("o092", ts=stamp(SRT, "How fast they can talk"), from_y=230, paras=[
        "The difference from the memory bus is only distance and count. Fewer wires, longer, therefore "
        "slower, and each bit costs more energy to send.",
        "So a chip has three bandwidths, not one: to its own memory, to a neighbouring chip, and out to the "
        "network. On an H100 system each is several times slower than the one before, as the coming "
        "figures count.",
        "Keeping those three apart is essential once a model stops fitting on one chip, which is where "
        "this part is heading.",
    ])
    edit_item("o093", ts=stamp(SRT, "two ways to wire"), from_y=250, paras=[
        "NVLink gives every GPU full-speed access to every other in the domain. InfiniBand between boxes "
        "carries about a ninth as many bytes a second, each way ({fig}).".replace("{fig}", "{{fig:v02-p34}}"),
    ], caption="The boundary between the two is the most important line in a cluster: whatever crosses it "
               "pays the network's rate.")
    edit_item("o094", ts=stamp(SRT, "Scale-out is the other way"), replace=[
        ('dominant-baseline="central">HBM, thousands of</text>', 'dominant-baseline="central">HBM, 5,120</text>'),
        ('dominant-baseline="central">short connections</text>', 'dominant-baseline="central">short wires</text>'),
        ('dominant-baseline="central">NVLink, hundreds of</text>', f'dominant-baseline="central">NVLink, {PAIRS_ALL} pairs</text>'),
        ('dominant-baseline="central">longer ones</text>', 'dominant-baseline="central">of longer wires</text>'),
    ], from_y=180, paras=[
        "Bandwidth is width times frequency, and width means physical connections. A package can carry "
        "thousands of them over millimetres; a board connector carries far fewer over centimetres; a "
        "network cable carries fewer still over metres.",
        "Each hop out also costs more energy per bit, because driving a longer wire at the same rate takes "
        "more power.",
        "So the drop at each level, several times per step, is not a design oversight. It is geometry.",
    ])
    edit_item("o096", at=218, replace=[
        ('>results exchanged at every layer, dozens of times per token</text>',
         f'>results exchanged twice a layer: {AR_PER_LAYER * L70} times a token for {L70} layers</text>'),
    ], from_y=200, paras=[
        "Splitting a layer's matrix multiply across GPUs means they must exchange partial results "
        "constantly. Inside an NVLink domain that is affordable. Across InfiniBand it dominates.",
        f"The frequency is what makes the difference decisive. A single slow exchange would not matter; "
        f"{AR_PER_LAYER * L70} a token, each given a ninth of NVLink's bandwidth across InfiniBand, become "
        "the bottleneck.",
    ], caption="Communication is paid per layer per token, so it multiplies with model depth. It is the "
               "constraint the fifth atlas, on parallelism, is built around.")
    edit_item("o097", from_y=250, at=265, paras=[
        "One liquid-cooled rack, all 72 in a single NVLink domain. Far more of the model fits in the fast "
        "neighbourhood before you are forced onto the slow fabric.",
        f"Between them the 72 GPUs hold {NVL72_TB} TB, and through the rack's switches each reaches any "
        "other at the full 1.8 TB/s.",
    ])


if __name__ == "__main__":
    p32()
    p33()
    o095()
    p34()
    p35()
    fixes()
