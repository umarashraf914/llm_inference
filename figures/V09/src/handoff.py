"""V9 Part 6, the handoff (stop 3): Fig 8 cut to the split, N17 (token two waits), N18 (the 1,100
bytes), N19 (70 KB a token), N20 (a server's parts, the OS, direct memory access), Fig 9 redrawn as two
routes, N21 (the transfer priced). plans/depth_pass/V09_review.md §4 F and §5 Figs 8, 9.

  python3 figures/V09/src/handoff.py    writes items o008 n17 n18 n19 n20 o009 n21

Sources: Kimi K2's config.json (64 heads, latent rank 512, 64 rotary dims, 61 layers), used as a
published model with this trace's numbers. NVIDIA's DGX GB200 user guide (each compute tray: 2 Grace
CPUs, 4 Blackwell GPUs, four 400G ConnectX-7 cards, one operating system image) and GB200 NVL72 page
(372 GB HBM3E and up to 480 GB LPDDR5X per superchip of 1 CPU and 2 GPUs). NVIDIA's GPUDirect RDMA
documentation ("a direct path for data exchange between the GPU and a third-party peer device ...
network interfaces"; memory pinned ahead of time, transfers then made "without entering the kernel").
"""
import math
from common import SRT, box, cell, cont, ghost, txt, hd, ln, para, stamp, emit, width, f, n

LAYERS, HEADS, HEAD = 61, 64, 128
LATENT, ROPE = 512, 64
LAT_B = (LATENT + ROPE) * 2                  # bytes per token per layer at 16 bits
STD_B = 2 * HEADS * HEAD * 2                 # a key and a value per head
PER_TOK = LAT_B * LAYERS
assert LAT_B == 1152 and PER_TOK == 70272 and STD_B == 32768
RATIO, RATIO128 = STD_B / LAT_B, 2 * 128 * HEAD * 2 / LAT_B
assert round(RATIO, 1) == 28.4 and round(RATIO128) == 57
PROMPT_T = 4000
CACHE = PROMPT_T * PER_TOK
STD_CACHE = PROMPT_T * LAYERS * STD_B
assert round(CACHE / 1e6) == 281 and round(STD_CACHE / 1e9, 1) == 8.0
NIC = 50e9                                    # one 400 Gb/s card, bytes a second each way
T_STD, T16, T8, T4 = STD_CACHE / NIC, CACHE / NIC, CACHE / 2 / NIC, CACHE / 4 / NIC
assert round(T_STD * 1e3) == 160 and round(T16 * 1e3, 1) == 5.6 and round(T8 * 1e3, 1) == 2.8
CAP_TOK = 12.9e12 / PER_TOK
assert round(CAP_TOK / 1e6, 1) == 183.6 and round(CAP_TOK / PROMPT_T, -2) == 45900


def o008():
    b = [hd(40, 46, "What prefill hands over, and what it keeps")]
    b.append(box(40, 70, 230, 64, "m", "prefill machine B", "ends with the whole cache, token 1", rx=6))
    b.append(box(410, 70, 230, 64, "h", "the decode machines", "write the rest, a token a step", rx=6))
    b.append(f'<line class="conn" x1="276" y1="102" x2="404" y2="102" marker-end="url(#arw)"/>')
    b.append(txt(340, 92, "a copy of the cache", "sub2", "middle"))
    b.append(cell(40, 160, 230, 30, "s", label="the original stays in B's cache"))
    b.append(f'<line class="conn" x1="155" y1="137" x2="155" y2="156" marker-end="url(#arw)"/>')
    b.append(txt(290, 180, "ready for the next request that shares the prefix", "sub2"))
    body, yb = para(236, [
        "Prefill ends with a key-value cache covering the whole prompt, all 4,000 tokens of it, and "
        "with the first token of the answer: the last layer's scores pick it, exactly as every later "
        "step will pick its token.",
        "The rest of the answer is written on the decode machines, so a copy of the cache has to cross "
        "to them, and it has to arrive before generation can continue. The original stays behind on "
        "machine B, ready for the next request that shares the prefix.",
        "Splitting the phases is only worth it if what crosses is small and crosses fast. The model's "
        "attention sets its size and the network sets its speed; the rest of this part takes them in "
        "turn.",
    ])
    emit("o008", stamp(SRT, "ends with a key value"),
         "Prefill hands decode a copy of the cache, and keeps the prefix for the next request", yb + 30,
         b + [body],
         "The split from the serving episode, seen from this request. Its whole cost is the copy in the "
         "middle, which is what the rest of this part shrinks.")


def n17():
    b = [hd(40, 46, "Four lanes, schematic times: the cache crosses between token 1 and token 2")]
    X0 = 170
    lanes = ["prefill machine", "network", "decode machine", "the user"]
    LY = [70 + k * 40 for k in range(4)]
    for k, s_ in enumerate(lanes):
        b.append(txt(40, LY[k] + 18, s_, "cap"))
    P1 = 330                                   # prefill ends
    b.append(cell(X0, LY[0], P1 - X0, 26, "m", label="prefill: 100 new tokens"))
    TX = 436                                   # the cache has landed
    b.append(cell(P1 + 4, LY[1], TX - P1 - 4, 26, "h", label="cache crosses"))
    b.append(ghost(X0, LY[2], TX - X0, 26, label="nothing to do yet"))
    STEP, GAP = 28, 6
    xs = []
    x = TX
    for k in range(6):
        b.append(cell(x, LY[2], STEP, 26, "m"))
        xs.append(x + STEP)
        x += STEP + GAP
    marks = [P1 + 4] + [v + 4 for v in xs]
    for k, xm in enumerate(marks):
        if xm + 18 > 640:
            break
        b.append(cell(xm, LY[3], 18, 26, "s", label=str(k + 1)))
    yb0 = LY[3] + 26
    for xa, xb_, s_ in [(X0, P1 + 4, "the first token"), (P1 + 22, marks[1], "token 2 waits"),
                        (marks[1] + 18, 640, "one step per token")]:
        b.append(txt((xa + xb_) / 2, yb0 + 18, s_, "sub2", "middle"))
    body, yb = para(yb0 + 62, [
        "Prefill's last layer gives the first token, and it streams straight to the user "
        "({{fig:v01-o058}}). The second token cannot start until the decode machine holds the cache, "
        "because writing it means attending to the keys and values of every token before it "
        "({{fig:v01-o136}}).",
        "So the transfer sits between the first token and the second. It is paid once per request, in "
        "the first gap the user sees; after it, tokens arrive at decode's own pace. Two figures on, it "
        "gets a price.",
    ])
    emit("n17", stamp(SRT, "The cache has to reach the decode"),
         "Token two waits for the cache to land", yb + 30, b + [body],
         "Schematic times. The handoff does not slow the stream; it delays its second token, once.")


def n18():
    b = [hd(40, 46, "One token's cache for one layer, drawn to scale by area: 1 number = 1 × 8 px")]
    X0, U, H1 = 40, 1, 8
    b.append(txt(40, 82, "latent attention", "cap"))
    b.append(cell(X0, 92, LATENT * U, H1, "s", rx=1))
    b.append(cell(X0 + LATENT * U, 92, ROPE * U, H1, "u", rx=1))
    b.append(txt(X0, 118, f"512 numbers of summary + 64 of position = 576 numbers × 2 bytes = {n(LAT_B)} bytes", "sub2"))
    Hs = STD_B / 2 * H1 / ((LATENT + ROPE) * U)
    b.append(txt(40, 160, "standard attention, 64 heads", "cap"))
    b.append(cell(X0, 170, (LATENT + ROPE) * U, Hs, "h", rx=2,
                  label=f"2 × 64 heads × 128 = {n(STD_B // 2)} numbers × 2 bytes = {n(STD_B)} bytes"))
    assert abs(Hs * (LATENT + ROPE) - STD_B / 2 * H1) < 1e-6
    yb0 = 170 + Hs
    b.append(txt(X0, yb0 + 22, f"{f(RATIO, 1)} times the latent's area. Across 61 layers: {n(PER_TOK)} bytes a token "
                 f"against {f(STD_B * LAYERS / 1e6, 1)} MB", "sub2"))
    body, yb = para(yb0 + 66, [
        "Standard attention keeps, for every token in every layer, a key and a value for each attention "
        "head: 2 × heads × head size numbers ({{fig:v03-o088}}). With 64 heads of 128 numbers, Kimi K2's "
        "shape, that is 16,384 numbers, or 32,768 bytes at 16 bits.",
        "Latent attention keeps one learned summary of 512 numbers, plus 64 more that carry position and "
        "cannot be folded into the summary ({{fig:v03-o092}}): 576 numbers, 1,152 bytes, the 'about "
        "1,100'. Keys and values are rebuilt from the summary when they are needed ({{fig:v03-o091}}).",
        f"That is {f(RATIO, 1)} times smaller here; with 128 heads, the case V3 works through, it is 57 "
        f"times. Across 61 layers it comes to {n(PER_TOK)} bytes, about 70 kilobytes, for each token of "
        "the prompt.",
    ])
    emit("n18", stamp(SRT, "Latent attention stores one short vector"),
         "The 1,100 bytes are 512 numbers of summary and 64 of position, two bytes each", yb + 30,
         b + [body],
         "Drawn to scale by area. The cache that has to cross the network is the thin strip, and its size "
         "was fixed when the model was designed, not when it is served.")


def n19():
    b = [hd(40, 46, "Cache made by one prompt, at 70,272 bytes a token, to scale")]
    X0, X1, TOP = 170, 620, 400e6
    sc = (X1 - X0) / TOP
    y = 68
    for t in (2000, 3000, 4000, 5000):
        v = t * PER_TOK
        b.append(txt(40, y + 18, f"{n(t)} tokens", "cap"))
        b.append(cell(X0, y, v * sc, 26, "h" if t == PROMPT_T else "u", label=f"{f(v / 1e6, 0)} MB"))
        y += 36
    ya = y + 2
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v in range(0, 401, 100):
        b.append(ln(X0 + v * 1e6 * sc, ya, X0 + v * 1e6 * sc, ya + 4, "tick"))
        b.append(txt(X0 + v * 1e6 * sc, ya + 18, f"{v} MB", "sub2", "middle"))
    yh = ya + 64
    b.append(hd(40, yh, "And what the rack's spare memory holds"))
    E = [("12.9 TB of memory", 150, "u"), ("÷", 0, ""), ("70,272 bytes a token", 160, "u"), ("=", 0, ""),
         ("183.6 million tokens", 160, "s")]
    x = 40
    for s_, w, c in E:
        if w:
            b.append(cell(x, yh + 16, w, 36, c, rx=6, label=s_))
            x += w
        else:
            b.append(txt(x + 14, yh + 38, s_, "sub2", "middle"))
            x += 28
    assert x <= 640 and round(CAP_TOK / 1e6, 1) == 183.6
    b.append(txt(40, yh + 74, f"about {n(round(CAP_TOK / PROMPT_T, -2))} conversations of 4,000 tokens, "
                 "held at once", "sub2"))
    body, yb = para(yh + 118, [
        "A prompt of a few thousand tokens makes a cache of a few hundred megabytes: this one's 4,000 "
        f"tokens make {f(CACHE / 1e6, 0)} MB, and that is what the handoff has to move.",
        "Turned around, the 12.9 terabytes the weights leave free ({{fig:v09-o004}}) hold the caches of "
        "about 46,000 such conversations at once. That is an upper bound: the rack's memory is shared "
        "between the prefill and decode pools, and the computation itself needs room too.",
    ])
    emit("n19", stamp(SRT, "A prompt of a few thousand tokens"),
         "Seventy kilobytes a token: what one prompt makes, and what 12.9 terabytes holds", yb + 30,
         b + [body],
         "Bars to scale. Per conversation the cache is small; across a rack's worth of conversations it is "
         "the main tenant.")


def n20():
    b = [hd(40, 46, "One machine: a compute tray, its parts drawn as peers, schematic")]
    C = (40, 66, 600, 228)
    b.append(cont(*C, "u", "one compute tray, running one operating system"))
    b.append(ghost(56, 104, 568, 44))
    for k in range(2):
        x = 72 + k * 276
        b.append(cell(x, 112, 110, 28, "u", label=f"Grace CPU {k + 1}"))
        b.append(cell(x + 118, 112, 142, 28, "u", label="main memory, 480 GB"))
    for k in range(4):
        x = 56 + k * 145
        b.append(cell(x, 162, 133, 46, "m", label=f"GPU {k + 1}: 186 GB HBM"))
        b.append(cell(x, 220, 133, 28, "s", label="network card"))
    b.append(txt(56, 274, "the OS runs on the CPUs (dashed); every device is reached through it", "sub2"))
    body, yb = para(C[1] + C[3] + 44, [
        "Each machine in the rack is a compute tray: two Grace CPUs with their main memory, four GPUs "
        "with their own fast memory, and a 400 Gb/s network card for each GPU. One operating system "
        "runs it: the program, running on the CPUs, that owns every device and hands them out to the "
        "other programs that ask.",
        "Moving bytes between memories is a copy: every byte is read from one place and written to "
        "another, so it costs time in proportion to the bytes, a count against a rate ({{fig:v01-o063}}). "
        "A processor that copies is a processor that is doing nothing else.",
        "Devices can copy without the processor. Direct memory access means a device, such as a network "
        "card, reads or writes memory itself: the processor only says where and how much, and the device "
        "moves the bytes.",
    ])
    emit("n20", stamp(SRT, "Moving a few hundred megabytes between"),
         "A server's parts, and who normally moves bytes from one machine to the next", yb + 30,
         b + [body],
         "A floor plan of peers, not nesting: none of these parts contains another. The counts are "
         "NVIDIA's for a GB200 compute tray; the layout is schematic.")


def _route(b, x0, rdma):
    """One panel: sender column, receiver column, three stations each."""
    st = [("GPU memory", 92), ("main memory", 152), ("network card", 212)]
    cols = [x0 + 12, x0 + 160]
    for ci, cx in enumerate(cols):
        for k, (s_, y) in enumerate(st):
            if rdma and k == 1:
                b.append(ghost(cx, y, 116, 34, label="untouched"))
            else:
                b.append(cell(cx, y, 116, 34, "m" if k == 0 else ("s" if k == 2 else "u"), label=s_))
    b.append(f'<line class="conn" x1="{cols[0] + 120}" y1="229" x2="{cols[1] - 4}" y2="229" marker-end="url(#arw)"/>')
    if not rdma:
        for cx, down in ((cols[0], True), (cols[1], False)):
            m = cx + 58
            pairs = [(126, 148), (186, 208)] if down else [(208, 186), (148, 126)]
            for a, z in pairs:
                y1, y2 = (a + 2, z) if down else (a - 2, z)
                b.append(f'<line class="conn" x1="{m}" y1="{y1}" x2="{m}" y2="{y2}" marker-end="url(#arw)"/>')
            for yy in (141, 201):
                b.append(txt(m + 8, yy, "copy", "sub2"))
    else:
        L, R = cols[0], cols[1] + 116
        b.append(f'<polyline class="conn" points="{L},109 {L - 8},109 {L - 8},229 {L - 2},229" marker-end="url(#arw)"/>')
        b.append(f'<polyline class="conn" points="{R + 2},229 {R + 8},229 {R + 8},109 {R + 2},109" marker-end="url(#arw)"/>')


def o009():
    b = [hd(40, 46, "Two routes for the same cache, schematic")]
    b.append(txt(52, 74, "the ordinary route", "cap"))
    b.append(txt(362, 74, "remote direct memory access", "cap"))
    _route(b, 40, False)
    _route(b, 350, True)
    for x, s_ in [(52, "sender"), (200, "receiver"), (362, "sender"), (510, "receiver")]:
        b.append(txt(x + 58, 266, s_, "sub2", "middle"))
    b.append(txt(362, 286, "the OS only grants permission, once, ahead of time", "sub2"))
    body, yb = para(330, [
        "Ordinarily a program hands its data to the operating system, which copies it into its own "
        "buffers in main memory before the network card sends it, and the receiving machine's operating "
        "system copies it out again. For a cache held in GPU memory there are further copies to and from "
        "main memory at each end, and a processor spends time on every byte.",
        "Remote direct memory access skips all of that. The network card on the prefill machine reads "
        "the cache straight out of GPU memory and the card on the decode machine writes it straight into "
        "GPU memory, so neither processor touches the data and neither operating system is involved. "
        "The operating systems only register the memory in advance and grant the cards permission.",
        "Storing the cache at eight or four bits instead of sixteen trims it further before it crosses: "
        "quantization applied to the cache rather than the weights ({{fig:v04-o070}}).",
    ])
    emit("o009", stamp(SRT, "Remote direct memory access skips them."),
         "Remote direct memory access sends the cache card to card, past both operating systems", yb + 30,
         b + [body],
         "Schematic: how many copies the ordinary route makes depends on the software. The transfer is the "
         "price disaggregation pays, and three techniques cut it: latent attention, a narrower cache, and "
         "this shorter route.")


def n21():
    b = [hd(40, 46, "Time to send this request's 4,000-token cache over one 400 Gb/s card, log scale")]
    X0, X1, LO, HI = 250, 620, 1e-3, 1.0
    px = lambda s_: X0 + math.log10(s_ / LO) / math.log10(HI / LO) * (X1 - X0)
    rows = [("standard, 16 bits", STD_CACHE, T_STD, "h"), ("latent, 16 bits", CACHE, T16, "u"),
            ("latent, 8 bits", CACHE / 2, T8, "s"), ("latent, 4 bits", CACHE / 4, T4, "s")]
    y = 68
    for lab, by, t, c in rows:
        b.append(txt(40, y + 18, lab, "cap"))
        w = px(t) - X0
        s_ = f"{f(by / 1e9, 1)} GB, {f(t * 1e3, 0)} ms" if by > 1e9 else f"{f(by / 1e6, 0)} MB, {f(t * 1e3, 1)} ms"
        if width(s_, "sub") + 24 <= w:
            b.append(cell(X0, y, w, 26, c, label=s_))
        else:
            b.append(cell(X0, y, w, 26, c))
            b.append(txt(X0 + w + 10, y + 18, s_, "sub2"))
        y += 38
    ya = y + 2
    b.append(ln(X0, ya, X1, ya, "axis"))
    for v, s_ in [(1e-3, "1 ms"), (1e-2, "10 ms"), (1e-1, "100 ms"), (1.0, "1 s")]:
        b.append(ln(px(v), ya, px(v), ya + 4, "tick"))
        b.append(txt(px(v), ya + 18, s_, "sub2", "middle"))
    body, yb = para(ya + 62, [
        "Time is bytes divided by rate ({{fig:v01-o063}}). One 400 Gb/s card moves 50 gigabytes a second "
        "each way ({{fig:v09-n03}}), so a 4,000-token cache at 70 KB a token, 281 MB, takes 5.6 "
        "milliseconds.",
        "Had the model used standard attention with its 64 heads, the same cache would be 8.0 GB and take "
        "160 ms, about a sixth of a second, before the second token could start. Halving the bits halves "
        "the time again: 2.8 ms at 8 bits, 1.4 ms at 4, plus a little for the scales 4-bit values need.",
        "The cache tolerates less squeezing than the weights do, because it is made on the fly and its "
        "errors feed every later token ({{fig:v04-o070}}), which is why 8 bits is the common choice.",
    ])
    emit("n21", stamp(SRT, "Storing the cache at eight or four bits"),
         "Latent attention and an 8-bit cache turn a sixth of a second into three milliseconds", yb + 30,
         b + [body],
         "Log scale. This is the gap in the lane chart, priced. Latent attention does most of the work, "
         "and a narrower cache halves what is left.")


if __name__ == "__main__":
    for fn in (o008, n17, n18, n19, n20, o009, n21):
        fn()
