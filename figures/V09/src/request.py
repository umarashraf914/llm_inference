"""V9 Part 1, the request and the machine: Fig 1 redrawn in token order, N1 (tools are text), N2 (the
slot), Fig 3 redrawn as the real rack, N3 (130 TB/s decomposed), Fig 4 with the block scales.
plans/depth_pass/V09_review.md §4 A-B and §5 Figs 1, 3, 4.

  python3 figures/V09/src/request.py    writes items o001 n01 n02 o003 n03 o004

Sources read for the rack: NVIDIA's GB200 NVL72 page (72 GPUs, 13.4 TB at 576 TB/s, 130 TB/s NVLink,
"acts as a single, massive GPU"); NVIDIA's DGX GB200 user guide (18 compute trays of 2 Grace CPUs and
4 Blackwell GPUs, 9 NVLink switch trays of 2 switch chips, four 400G ConnectX-7 cards per compute
tray); NVIDIA's GB200 NVL72 technical blog (18 NVLink ports per GPU at 100 GB, 1.8 TB/s
bidirectional per GPU).
"""
import math
from common import SRT, box, cell, cont, ghost, txt, hd, ln, para, stamp, emit, width, f, n

# ---- the rack, as NVIDIA specifies it --------------------------------------------------------------
TRAYS, GPU_PER_TRAY, CPU_PER_TRAY = 18, 4, 2
SW_TRAYS, SW_CHIPS, LINKS, PORTS_PER_SW_TRAY = 9, 2, 18, 144
GPUS = TRAYS * GPU_PER_TRAY
assert GPUS == 72 and SW_TRAYS * PORTS_PER_SW_TRAY == GPUS * LINKS          # every port used once
LINK_GBS_BOTH = 100                       # GB/s per NVLink link, counting both directions
NVL_BOTH = LINKS * LINK_GBS_BOTH / 1000   # TB/s per GPU, both directions
NVL_ONE = NVL_BOTH / 2
HBM = 8.0                                 # TB/s per GPU: 576 TB/s / 72
NIC = 400 / 8 / 1000                      # TB/s each way: one 400 Gb/s ConnectX-7 per GPU
assert NVL_BOTH == 1.8 and 576 / GPUS == HBM and NIC == 0.05
FABRIC = GPUS * NVL_BOTH                  # 129.6, which NVIDIA rounds to 130
assert round(FABRIC) == 130
R_LINK, R_NIC = HBM / NVL_ONE, NVL_ONE / NIC
assert round(R_LINK, 1) == 8.9 and R_NIC == 18

# ---- memory -------------------------------------------------------------------------------------------
RACK_TB, PARAMS = 13.4, 1e12
W_GB = PARAMS * 0.5 / 1e9                           # 4-bit codes alone
WS_GB = PARAMS * (0.5 + 1 / 16) / 1e9               # plus one 8-bit scale per 16 weights
assert W_GB == 500 and WS_GB == 562.5
P_W, P_WS = W_GB / (RACK_TB * 1000), WS_GB / (RACK_TB * 1000)
assert P_W < 0.04 and round(P_WS * 100, 1) == 4.2
LEFT, LEFT_S = RACK_TB - W_GB / 1000, RACK_TB - WS_GB / 1000
assert round(LEFT, 1) == 12.9 and round(LEFT_S, 1) == 12.8

# ---- the prompt (illustrative token counts; N9 reuses them) -------------------------------------------
PROMPT = [("system prompt and tools", 1500), ("earlier turns", 900), ("the file that failed", 1200),
          ("the test's error", 300), ("the newest question", 100)]
TOTAL = sum(t for _, t in PROMPT)
assert TOTAL == 4000 and PROMPT[-1][1] / TOTAL == 0.025


def o001():
    b = [hd(40, 46, "What arrives at the server, in the order the model reads it")]
    X0, X1 = 262, 630
    sc = (X1 - X0) / TOTAL
    y, pos = 70, 0
    for k, (name, t) in enumerate(PROMPT):
        lab = f"{name}, {n(t)}"
        assert width(lab, "cap") < X0 - 52
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(cell(X0 + pos * sc, y, max(t * sc, 3), 24, "h" if k == len(PROMPT) - 1 else "s"))
        pos += t
        y += 34
    ya = y + 2
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v in range(0, TOTAL + 1, 1000):
        b.append(ln(X0 + v * sc, ya, X0 + v * sc, ya + 4, "tick"))
        b.append(txt(X0 + v * sc, ya + 18, n(v), "sub2", "middle"))
    b.append(txt(X0, ya + 38, "position in the prompt, in tokens", "sub2"))
    body, yb = para(ya + 82, [
        "The serving software joins everything into one block before the model sees it, always in the "
        "same order: text shared by every user first, then this conversation, then the newest message "
        "({{fig:v01-o023}}). The model reads it as tokens ({{fig:v01-o006}}), a few thousand here.",
        "The file and the error arrived in earlier turns. A minute ago the assistant ran the test and "
        "read the file, and both outputs joined the conversation as text. So the first four blocks have "
        "all been through the model before; only the last has not.",
        "From arrival to the last token of the answer, the request holds a place somewhere in the rack. "
        "The next three figures say what that place is, and what the rack is.",
    ])
    emit("o001", stamp(SRT, "A user asks a coding assistant to fix a"),
         "The prompt arrives as one block, shared text first and the new question last", yb + 30,
         b + [body],
         "Nearly all of this prompt was here a minute ago. Only the last block is new, and that decides "
         "where it goes next. Token counts are illustrative; the bars are drawn to scale.")


def n01():
    b = [hd(40, 46, "One turn of the loop: text in, text out, and software in between")]
    L = (40, 70, 258, 132)
    R = (382, 70, 258, 132)
    tools = ["run_tests(path): runs a test", "read_file(path): returns a file",
             "edit_file(path, patch): edits it"]
    call = ['{"name": "edit_file",', ' "arguments": {', '   "path": "tests/test_parser.py",',
            '   "patch": "…" }}']
    b.append(cont(*L, "u", "In the prompt: the tools"))
    for k, s in enumerate(tools):
        assert width(s, "sub") < L[2] - 44
        b.append(f'<g class="u"><text class="sub" x="{L[0] + 22}" y="{L[1] + 56 + k * 20}">{s}</text></g>')
    b.append(cont(*R, "u", "Out of the model: a call"))
    for k, s in enumerate(call):
        assert width(s, "sub") < R[2] - 44
        b.append(f'<g class="u"><text class="sub" x="{R[0] + 22}" y="{R[1] + 56 + k * 20}" '
                 f'style="white-space:pre">{s}</text></g>')
    b.append(f'<line class="conn" x1="{L[0] + L[2] + 6}" y1="136" x2="{R[0] - 6}" y2="136" marker-end="url(#arw)"/>')
    b.append(txt((L[0] + L[2] + R[0]) / 2, 126, "the model", "sub2", "middle"))
    B = (205, 262, 270, 52)
    b.append(box(*B, "u", "the serving software", "parses the call and runs the code", rx=6))
    b.append(f'<line class="conn" x1="540" y1="{R[1] + R[3] + 4}" x2="{B[0] + B[2] + 4}" y2="{B[1] + 26}" marker-end="url(#arw)"/>')
    b.append(txt(552, 246, "if it parses", "sub2"))
    b.append(f'<line class="conn" x1="{B[0] - 4}" y1="{B[1] + 26}" x2="140" y2="{L[1] + L[3] + 4}" marker-end="url(#arw)"/>')
    b.append(txt(40, 252, "its output joins", "sub2"))
    b.append(txt(40, 268, "the next prompt", "sub2"))
    body, yb = para(B[1] + B[3] + 46, [
        "A tool is described to the model in plain words: a name, its arguments and what it does. The "
        "descriptions sit in the system prompt like any other text and cost tokens on every turn. The "
        "code behind them never enters the model ({{fig:v01-o024}}). The three names here are "
        "illustrative.",
        "The model cannot run anything. It writes text in a shape the serving software recognises as a "
        "call: a small object in JSON, a format for structured data, naming the tool and its arguments. "
        "The software parses that text, runs the code, and adds the result to the conversation as text "
        "for the next turn.",
        "This request ends in exactly such a call. Part 8 shows how the engine makes certain the text "
        "will parse.",
    ])
    emit("n01", stamp(SRT, "receives a system prompt listing the"),
         "The tools are text in the prompt, and the call they produce is text that software runs",
         yb + 30, b + [body],
         "The model's whole part is text in and text out. The tools are a contract written in the prompt, "
         "and a call is worth something only if the software can parse it.")


def n02():
    b = [hd(40, 46, "Eight seats share each step; every seat holds cache blocks of its own")]
    C = (40, 66, 420, 0)
    seats, SW, SG = 8, 40, 8
    blocks = [5, 9, 7, 3, 11, 6, 2, 8]                  # cache blocks held per seat (schematic)
    x0, ys = C[0] + 22, C[1] + 48
    BH, BG = 10, 3
    col_bottom = ys + 26 + 8 + max(blocks) * (BH + BG) - BG
    H = col_bottom + 40 - C[1]
    b.append(cont(C[0], C[1], C[2], H, "u", "One decode engine's running batch"))
    for k in range(seats):
        x = x0 + k * (SW + SG)
        b.append(cell(x, ys, SW, 26, "u", label=str(k + 1)))
        for j in range(blocks[k]):
            b.append(cell(x + 4, ys + 26 + 8 + j * (BH + BG), SW - 8, BH, "h", rx=2))
    x3 = x0 + 2 * (SW + SG)
    b.append(ghost(x3 - 4, ys - 4, SW + 8, 26 + 8 + blocks[2] * (BH + BG) - BG + 8))
    QX = 496
    b.append(txt(QX, C[1] + 26, "the queue", "cap"))
    for k in range(3):
        b.append(cell(QX, ys + k * 34, 144, 26, "u", label="a waiting request"))
    b.append(f'<line class="conn" x1="{QX - 6}" y1="{ys + 13}" x2="{x0 + seats * (SW + SG) - SG + 10}" y2="{ys + 13}" marker-end="url(#arw)"/>')
    b.append(txt(QX, ys + 3 * 34 + 14, "the head of the queue takes", "sub2"))
    b.append(txt(QX, ys + 3 * 34 + 30, "the next seat that frees", "sub2"))
    b.append(txt(x0, C[1] + H + 22, "seat 3, outlined, is this request. Each red block holds the keys and values", "sub2"))
    b.append(txt(x0, C[1] + H + 38, "for a run of one request's tokens.", "sub2"))
    body, yb = para(C[1] + H + 82, [
        "The decode machines run their requests as one batch, and every step advances each of them by one "
        "token ({{fig:v07-o006}}). A slot is one seat in that batch. With the seat comes memory for the "
        "request's cache, held in fixed-size blocks that need not sit side by side ({{fig:v03-o086}}).",
        "Seats are limited by memory, not by arithmetic. Each seat's cache grows with its conversation, "
        "and once the memory left over after the weights is full, newcomers wait ({{fig:v07-o005}}).",
        "This request is prefilled on another machine first, then takes a seat and keeps it until its "
        "last token. Then the seat goes to the head of the queue ({{fig:v09-o013}}).",
    ])
    emit("n02", stamp(SRT, "answer, the request occupies a slot"),
         "A slot is a seat in the running batch, with cache memory held for it", yb + 30, b + [body],
         "Schematic: eight seats, where a real engine holds dozens. The number of seats is set by cache "
         "memory, which is why so much of this stack exists to shrink the cache.")


def o003():
    b = []
    C = (40, 60, 244, 0)
    GW, GH, CW, P = 22, 11, 22, 14                    # GPU and CPU squares, row pitch
    x0, y = C[0] + 22, C[1] + 44
    rows = []
    for k in range(TRAYS // 2):
        rows.append(("c", y)); y += P
    y += 6
    for k in range(SW_TRAYS):
        rows.append(("s", y)); y += 11
    y += 6
    for k in range(TRAYS - TRAYS // 2):
        rows.append(("c", y)); y += P
    H = y - P + GH + 20 - C[1]
    b.append(cont(C[0], C[1], C[2], H, "u", "One rack"))
    for kind, yy in rows:
        if kind == "c":
            for g in range(GPU_PER_TRAY):
                b.append(cell(x0 + g * (GW + 4), yy, GW, GH, "m", rx=2))
            for c in range(CPU_PER_TRAY):
                b.append(cell(x0 + 4 * (GW + 4) + 14 + c * (CW + 4), yy, CW, GH, "u", rx=2))
        else:
            b.append(cell(x0, yy, 4 * (GW + 4) + 14 + 2 * CW + 4, 8, "s", rx=2))
    assert sum(1 for k, _ in rows if k == "c") == TRAYS and sum(1 for k, _ in rows if k == "s") == SW_TRAYS
    # the key, beside the cabinet
    KX = 316
    keys = [("m", f"GPU: {GPU_PER_TRAY} in each compute tray"), ("u", f"Grace CPU: {CPU_PER_TRAY} in each"),
            ("s", f"NVLink switch tray: {SW_TRAYS} in all")]
    for k, (c, s) in enumerate(keys):
        b.append(cell(KX, 70 + k * 24, 22, 11, c, rx=2))
        b.append(txt(KX + 32, 80 + k * 24, s, "sub2"))
    b.append(txt(KX, 168, f"{TRAYS} compute trays × {GPU_PER_TRAY} GPUs = {GPUS} GPUs", "cap"))
    # one GPU's links, fanned out to the nine switch trays
    gy0, sx, sw_, sh, sp = 214, 520, 120, 20, 27
    gx, gyc = KX, gy0 + 4 * sp + sh / 2
    b.append(cell(gx, gyc - 15, 92, 30, "m", label="one GPU"))
    for k in range(SW_TRAYS):
        yk = gy0 + k * sp
        b.append(f'<line class="conn" x1="{gx + 96}" y1="{gyc}" x2="{sx - 4}" y2="{yk + sh / 2}"/>')
    for k in range(SW_TRAYS):
        yk = gy0 + k * sp
        b.append(cell(sx, yk, sw_, sh, "s", label=f"switch tray {k + 1}"))
    yl = gy0 + SW_TRAYS * sp + 12
    b.append(txt(KX, yl, f"{LINKS} links per GPU, {LINKS // SW_TRAYS} to each switch tray", "sub2"))
    yc = max(C[1] + H, yl) + 48
    body, yb = para(yc, [
        "A rack is a metal cabinet about the height of a person, filled with trays of hardware and "
        f"plumbed for power and liquid cooling. In this one, {TRAYS} compute trays each hold "
        f"{GPU_PER_TRAY} Blackwell GPUs and {CPU_PER_TRAY} Grace CPUs: {GPUS} GPUs in all.",
        f"Nine more trays hold nothing but NVLink switches, {SW_CHIPS} switch chips in each. Every GPU "
        f"has {LINKS} links, {LINKS // SW_TRAYS} into each switch tray, so any GPU reaches any other "
        "through a single switch without going out to the building's network. That mesh of links is "
        "the fabric ({{fig:v02-o093}}).",
        "Before this rack, a fast domain was usually the 8 GPUs in one server. Stretching it to 72 is the "
        "point of the design ({{fig:v02-o097}}).",
    ])
    emit("o003", stamp(SRT, "The request is headed for a rack of 72"),
         "Seventy-two GPUs in 18 trays, joined through 9 switch trays", yb + 30, b + [body],
         "The physical object the trace runs on. The counts are NVIDIA's; the order of the trays in "
         "the cabinet is schematic.")


def n03():
    b = [hd(40, 46, "Where the 130 comes from")]
    E = [("72 GPUs", 110), ("×", 0), ("1.8 TB/s each", 150), ("=", 0), ("129.6 TB/s, about 130", 196)]
    x = 40
    for s, w in E:
        if w:
            b.append(cell(x, 64, w, 36, "u", rx=6, label=s))
            assert width(s, "sub") + 24 <= w
            x += w
        else:
            b.append(txt(x + 14, 87, s, "sub2", "middle"))
            x += 28
    b.append(txt(40, 124, f"each GPU's {LINKS} links at 100 GB/s, counting both directions, so "
                 f"{f(NVL_ONE, 1)} TB/s each way", "sub2"))
    b.append(hd(40, 174, "Three routes out of one GPU, per direction, on a log scale"))
    X0, X1, LO, HI = 262, 630, 10, 10000
    px = lambda gbs: X0 + (math.log10(gbs) - math.log10(LO)) / (math.log10(HI) - math.log10(LO)) * (X1 - X0)
    rows = [("its own memory", HBM * 1000, "u", f"{f(HBM, 0)} TB/s"),
            ("NVLink to any GPU in the rack", NVL_ONE * 1000, "s", f"{f(NVL_ONE, 1)} TB/s"),
            ("network card, out of the rack", NIC * 1000, "h", None)]
    y = 194
    for lab, v, c, inside in rows:
        assert width(lab, "cap") < X0 - 52
        b.append(txt(40, y + 18, lab, "cap"))
        w = px(v) - X0
        b.append(cell(X0, y, w, 26, c, label=inside))
        if inside is None:
            b.append(txt(X0 + w + 10, y + 17, f"{f(NIC * 1000, 0)} GB/s: a 400 Gb/s card", "sub2"))
        y += 38
    ya = y + 2
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v, s in [(10, "10 GB/s"), (100, "100 GB/s"), (1000, "1 TB/s"), (10000, "10 TB/s")]:
        b.append(ln(px(v), ya, px(v), ya + 4, "tick"))
        b.append(txt(px(v), ya + 18, s, "sub2", "middle"))
    body, yb = para(ya + 62, [
        "The fabric's 130 terabytes a second is a total. Each GPU's share is 1.8 TB/s, and NVIDIA counts "
        "both directions, so 0.9 TB/s each way. Because the fabric moves data that fast, NVIDIA describes "
        "the whole rack as a single, massive GPU.",
        f"In one sense that is fair: any GPU can reach any other's memory directly. In another it is not. "
        f"Reaching a neighbour's memory is about {f(R_LINK, 0)} times slower than reaching your own, and "
        f"leaving the rack through the network card is {f(R_NIC, 0)} times slower again "
        "({{fig:v05-o008}}).",
        "Those two drops decide where the heavy traffic in this trace is allowed to run: the experts' "
        "exchange stays inside the rack (Part 5), and the one transfer that must leave it is made as "
        "small as possible (Part 6).",
    ])
    emit("n03", stamp(SRT, "130 terabytes per second between those"),
         "130 terabytes a second is 72 GPUs at 1.8 each, each slower than a GPU's own memory",
         yb + 30, b + [body],
         "Log scale: each step along the axis is ten times the last. One rack can behave like one GPU only "
         "for traffic that never needs its own memory's speed.")


def o004():
    b = []
    X0, X1 = 40, 640
    sc = (X1 - X0) / (RACK_TB * 1000)                # px per GB
    b.append(txt(40, 60, "Memory in the rack", "cap"))
    b.append(cell(X0, 70, X1 - X0, 28, "u", label=f"{RACK_TB} TB of HBM across {GPUS} GPUs"))
    b.append(txt(40, 140, "What the model takes", "cap"))
    ww = WS_GB * sc
    b.append(cell(X0, 150, ww, 28, "s"))
    b.append(ghost(X0 + ww, 150, X1 - X0 - ww, 28, label=f"about {LEFT} TB left for key-value cache"))
    b.append(txt(40, 198, f"the weights: {n(W_GB)} GB as 4-bit codes, {f(WS_GB, 1)} GB with their block "
                 f"scales, {f(P_WS * 100, 1)}% of the rack", "sub2"))
    body, yb = para(244, [
        f"A trillion parameters stored at 4 bits, half a byte each, come to {n(W_GB)} gigabytes "
        f"({{{{fig:v01-o073}}}}): {f(P_W * 100, 1)}% of the rack's {RACK_TB} terabytes, under 4%.",
        f"That counts the 4-bit codes alone. Every block of 16 weights also carries an 8-bit scale (Part "
        f"5), half a bit more per weight: 0.5625 bytes each, or {f(WS_GB, 1)} GB, about "
        f"{f(P_WS * 100, 1)}% ({{{{fig:v04-o058}}}}). The bar above includes them. The picture does "
        "not change.",
        f"What is left, about {LEFT} terabytes ({f(LEFT_S, 1)} counting the scales), holds key-value "
        "cache: the attention state every conversation keeps and reuses for each new token "
        "({{fig:v01-o136}}). The weights no longer fill the machine. The conversations do.",
    ])
    emit("o004", stamp(SRT, "The rack holds 13.4 terabytes of memory."),
         "A trillion 4-bit weights fill about 4% of the rack, and the cache gets the rest", yb + 30,
         b + [body],
         "Bars to scale. Four-bit weights and 13 terabytes of memory turn the model into a sliver and make "
         "the cache the main tenant.")


if __name__ == "__main__":
    for fn in (o001, n01, n02, o003, n03, o004):
        fn()
