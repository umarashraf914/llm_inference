"""V5 Part 2, the vocabulary of exchange: Figs 6-8 rebuilt, N3-N8 of plans/depth_pass/V05_review.md.

One dataset runs through N3, N4 and Part 8's ring: GPU k holds [1, 2, 3, 4] × 10^(k-1), so every digit
of a sum says whose contribution has arrived.

  python3 figures/V05/src/part2_exchange.py     writes items o006-o008, n3-n8
"""
from v05common import *  # noqa: F401,F403

G = 4
DATA = [[(j + 1) * 10 ** k for j in range(G)] for k in range(G)]      # row k is GPU k+1
SUM = [sum(DATA[k][j] for k in range(G)) for j in range(G)]
assert DATA[1] == [10, 20, 30, 40] and SUM == [1111, 2222, 3333, 4444]


def grid(x0, y0, vals, cw=50, ch=28, gap=4, cls=lambda r, c: "u"):
    """A table of cells; a value of None draws an empty dashed slot."""
    o = []
    for r, row in enumerate(vals):
        for c, v in enumerate(row):
            x, y = x0 + c * (cw + gap), y0 + r * (ch + gap)
            o.append(ghost(x, y, cw, ch) if v is None else cell(x, y, cw, ch, cls(r, c), label=str(v)))
    return o


def gw(cw=50, gap=4, k=G):
    return k * cw + (k - 1) * gap


# ---- Fig 6: why splitting forces an exchange ------------------------------------------------------
def o006():
    b = [hd(40, 40, "In sequence: each GPU waits for the one before")]
    xs = [80, 210, 340, 470]
    for k, x in enumerate(xs):
        b.append(cell(x, 58, 110, 34, "u", label=f"GPU {k + 1}"))
        if k < 3:
            b.append(arr(x + 114, 75, x + 126, 75))
    b.append(txt(80, 116, "total time: four steps, one after another", "sub2"))
    b.append(hd(40, 160, "In parallel: all four work at once, then trade partial answers"))
    for k, x in enumerate(xs):
        b.append(cell(x, 178, 110, 34, "m", label=f"GPU {k + 1}"))
    b.append(cell(80, 222, 500, 30, "h", label="exchange and add the pieces, all four at once"))
    b.append(txt(80, 274, "total time: one step, plus the exchange", "sub2"))
    body, yb = prose(318, [
        "Split the model and the GPUs must exchange data. Four GPUs each holding a quarter of an "
        "answer have to trade and add their pieces before anyone can continue, and that exchange "
        "takes real time.",
        "Such all-at-once exchanges come in a handful of standard patterns called collectives, and "
        "each strategy in this video has one as its signature.",
    ])
    emit("o006", stamp(SRT, "Split the model and the GPUs must"),
         "Working in parallel means trading partial answers", yb + 26, b + [body],
         "Parallel work is only half the bill. The exchange that stitches the pieces together is the "
         "other half, and it is what every strategy below is priced by.")


# ---- Fig 7: the five patterns, as a menu ---------------------------------------------------------
def o007():
    b = [txt(214, 44, "each GPU starts with", "sub2"), txt(430, 44, "each GPU ends with", "sub2")]
    rows = [("All-reduce", "u", "a partial result", "the total, the same everywhere"),
            ("All-gather", "u", "one piece", "every piece, nothing added"),
            ("Reduce-scatter", "u", "a partial result", "one slice of the total"),
            ("All-to-all", "h", "a chunk for each other GPU", "the chunks addressed to it"),
            ("Point-to-point", "s", "one GPU sends", "one other GPU receives")]
    for k, (name, c, start, end) in enumerate(rows):
        y = 56 + k * 46
        b.append(box(40, y, 150, 34, c, name, rx=6))
        b.append(txt(214, y + 21, start, "sub2"))
        b.append(txt(430, y + 21, end, "sub2"))
    body, yb = prose(318, [
        "The workhorse is the all-reduce: every GPU contributes a partial result and every GPU gets "
        "back the total. Its two halves also show up on their own. An all-gather collects every "
        "GPU's piece onto every GPU without summing; a reduce-scatter does the sum but leaves each "
        "GPU holding just one slice of it.",
        "The heaviest pattern is the all-to-all, where every GPU sends a different chunk to every "
        "other GPU at once. The lightest is barely a collective at all: a point-to-point send, one "
        "GPU to one other. The next four figures run each of them on numbers.",
    ])
    emit("o007", stamp(SRT, "The workhorse is the all reduce"),
         "Five patterns, from the workhorse to the lightest", yb + 26, b + [body],
         "Each strategy in this video has one of these as its signature. Which pattern it fires, and "
         "how often, decides where on the hardware it can afford to live.")


# ---- N3: all-reduce on numbers -------------------------------------------------------------------
def n3():
    L, R = 100, 410
    b = [hd(40, 40, "Four GPUs, four numbers each; every GPU ends with the column sums")]
    for x, lab in ((L, "before: each GPU's own numbers"), (R, "after: the same sums on every GPU")):
        b.append(txt(x, 70, lab, "sub2"))
    b += grid(L, 82, DATA)
    b += grid(R, 82, [SUM] * G, cls=lambda r, c: "s")
    for k in range(G):
        b.append(txt(40, 82 + k * 32 + 19, f"G{k + 1}", "cap"))
    b.append(arr(L + gw() + 14, 140, R - 14, 140))
    b.append(txt((L + gw() + R) / 2, 130, "all-reduce", "sub2", "middle"))
    body, yb = prose(246, [
        "'Reduce' means combine position by position, here by adding. Position 1 collects "
        f"1 + 10 + 100 + 1,000 = {n(SUM[0])}; position 4, 4 + 40 + 400 + 4,000 = {n(SUM[3])}. "
        "Every GPU contributes, and every GPU gets the whole result back.",
        "Each GPU's numbers sit in their own decimal place: G1's in the ones, G2's in the tens, G3's "
        "in the hundreds, G4's in the thousands. So every digit of a sum says whose contribution has "
        "arrived, a bookkeeping trick used again in Part 8.",
        "Every GPU needs the total because the step that follows starts from the whole vector, on "
        "every GPU.",
    ])
    emit("n3", stamp(SRT, "Every GPU contributes a partial result"),
         "An all-reduce leaves every GPU holding the same sum", yb + 26, b + [body],
         "The digits are a ledger: a 1 in the hundreds place means G3's number has been added in. "
         "Watch for them when the ring takes this apart step by step.")


# ---- N4: its two halves --------------------------------------------------------------------------
def n4():
    CW, GP = 40, 3
    X = [62, 256, 450]
    b = [hd(40, 40, "Reduce-scatter adds but keeps one slice; all-gather copies without adding")]
    heads = ["start", "after a reduce-scatter", "after an all-gather"]
    for x, lab in zip(X, heads):
        b.append(txt(x, 70, lab, "sub2"))
    b += grid(X[0], 82, DATA, cw=CW, gap=GP)
    rs = [[SUM[c] if c == r else None for c in range(G)] for r in range(G)]
    b += grid(X[1], 82, rs, cw=CW, gap=GP, cls=lambda r, c: "s")
    b += grid(X[2], 82, [SUM] * G, cw=CW, gap=GP, cls=lambda r, c: "s")
    for k in range(G):
        b.append(txt(40, 82 + k * 31 + 19, f"G{k + 1}", "sub2"))
    W = gw(CW, GP)
    for a, c in ((X[0], X[1]), (X[1], X[2])):
        b.append(arr(a + W + 4, 140, c - 6, 140))
    b.append(txt(X[1], 228, "G1 finishes slice 1, G2 slice 2", "sub2"))
    b.append(txt(X[2], 228, "every slice copied everywhere", "sub2"))
    body, yb = prose(270, [
        "A reduce-scatter does the adding but leaves each GPU only one slice of the total: G1 ends "
        f"with {n(SUM[0])} in slice 1 and nothing else, G2 with {n(SUM[1])} in slice 2, and so on. "
        "Each grid shows the result a GPU holds.",
        "An all-gather does no arithmetic. It takes one slice from each GPU and copies every slice "
        "to every GPU. Run one after the other, the two produce exactly an all-reduce, and that is "
        f"how the fastest all-reduce is built ({fwd('n37', 'Part 8')}).",
    ])
    emit("n4", stamp(SRT, "Its two halves also show up"),
         "Reduce-scatter and all-gather are its two halves", yb + 26, b + [body],
         "Each half is useful on its own, and the pair is an all-reduce. Part 8's ring runs them in "
         "exactly this order.")


# ---- N5: all-to-all and point-to-point -----------------------------------------------------------
def n5():
    CW, GP = 40, 3
    L, R = 76, 300
    letters = "abcd"
    before = [[f"{letters[r]}{c + 1}" for c in range(G)] for r in range(G)]
    after = [[before[c][r] for c in range(G)] for r in range(G)]
    assert after[0] == ["a1", "b1", "c1", "d1"]
    sent = sum(1 for r in range(G) for c in range(G) if r != c)
    assert sent == G * (G - 1) == 12
    tone = lambda r, c: "s" if r == c else "h"
    b = [hd(40, 40, "All-to-all: chunk j of every GPU goes to GPU j")]
    b.append(txt(L, 70, "before: row = sender", "sub2"))
    b.append(txt(R, 70, "after: row = receiver", "sub2"))
    b += grid(L, 82, before, cw=CW, gap=GP, cls=tone)
    b += grid(R, 82, after, cw=CW, gap=GP, cls=tone)
    for k in range(G):
        b.append(txt(40, 82 + k * 31 + 19, f"G{k + 1}", "sub2"))
    W = gw(CW, GP)
    b.append(arr(L + W + 10, 140, R - 10, 140))
    b.append(txt(L, 228, "teal stays home; red crosses a link", "sub2"))
    b.append(hd(500, 76, "Point-to-point"))
    b.append(cell(500, 96, 52, 30, "u", label="G2"))
    b.append(cell(588, 96, 52, 30, "u", label="G3"))
    b.append(arr(556, 111, 584, 111))
    b.append(txt(500, 150, "one sender, one receiver,", "sub2"))
    b.append(txt(500, 166, "one message", "sub2"))
    body, yb = prose(270, [
        "In an all-to-all every GPU holds a different chunk for every GPU: G1's chunk a3 is meant for "
        "G3. Each GPU keeps the chunk addressed to itself and sends the other three, one to each "
        f"partner, all at once: {sent} transfers among four GPUs, 8 × 7 = 56 among eight.",
        "Afterwards row k holds everything addressed to GPU k, so the grid has been transposed. "
        "Nothing is added; it is pure rearrangement. A point-to-point send is the degenerate case: "
        "one chunk, one sender, one receiver.",
    ])
    emit("n5", stamp(SRT, "The heaviest pattern is the all to all"),
         "An all-to-all is a transpose; a point-to-point is one arrow", yb + 26, b + [body],
         "No arithmetic, only movement, so an all-to-all's cost is all transfer, and every pair of "
         "GPUs has something to say.")


# ---- N6: what each pattern asks of one GPU -------------------------------------------------------
def n6():
    N = 8
    ar, half, a2a = 2 * (N - 1) / N, (N - 1) / N, (N - 1) / N
    assert (ar, half) == (1.75, 0.875) and N * (N - 1) == 56 and 64 * 63 == 4032
    X0, S = 176, 160                                   # px for one message, S
    rows = [("all-reduce", ar, f"{f(ar)} S", "2 neighbours"),
            ("reduce-scatter", half, f"{f(half, 3)} S", "2 neighbours"),
            ("all-gather", half, f"{f(half, 3)} S", "2 neighbours"),
            ("all-to-all", a2a, f"{f(a2a, 3)} S, if chunks are equal", "7, all at once"),
            ("point-to-point", 1.0, "S, from one GPU only", "1")]
    b = [hd(40, 40, "Eight GPUs, S bytes on each: what one GPU sends"),
         txt(X0, 66, "bytes sent per GPU", "sub2"), txt(540, 66, "partners", "sub2")]
    for k, (lab, v, val, part) in enumerate(rows):
        y = 78 + k * 38
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, v * S, 26, "h"))
        b.append(txt(X0 + v * S + 10, y + 18, val, "sub2"))
        b.append(txt(540, y + 18, part, "sub2"))
    yS = 78 + 5 * 38 + 4                               # a scale bar: the length of one message
    b.append(ln(X0, yS, X0 + S, yS, "tick"))
    b.append(ln(X0, yS - 5, X0, yS + 5, "tick"))
    b.append(ln(X0 + S, yS - 5, X0 + S, yS + 5, "tick"))
    b.append(txt(X0 + S + 10, yS + 4, "S, one whole message", "sub2"))
    body, yb = prose(320, [
        f"An all-reduce done the best known way costs each GPU 2 × 7/8 = {f(ar)} times the message; "
        f"each half alone, 7/8 = {f(half, 3)}. Part 8 derives these ({{{{fig:v05-o022}}}}). An "
        "all-to-all also sends 7/8 of its buffer, the seven chunks addressed to others. By bytes it "
        "is not the heaviest.",
        f"It is the heaviest by what it demands. Every GPU talks to every other at once, "
        f"{N} × {N - 1} = {N * (N - 1)} conversations among eight GPUs and 64 × 63 = 4,032 among "
        "sixty-four. The chunks are uneven, and in a mixture-of-experts model they are redrawn for "
        "every batch. The reductions can be arranged so that each GPU only ever talks to two "
        "neighbours.",
    ])
    emit("n6", stamp(SRT, "And the lightest is barely a collective"),
         "What each pattern asks of one GPU", yb + 26, b + [body],
         "Bars to scale. Bytes alone do not rank the patterns: the all-to-all moves less per GPU than "
         "an all-reduce, yet it needs every link at once, in amounts nobody knows in advance.")


# ---- Fig 8: the hardware is not uniform ----------------------------------------------------------
def o008():
    nvb, nvh, net = 1800, 900, 50                      # GB/s as quoted
    assert nvh / net == 18 and nvb / net == 36
    b = [cont(40, 40, 285, 160, "s", "Inside one node")]
    for r in range(2):
        for c in range(4):
            b.append(cell(62 + c * 60, 94 + r * 46, 52, 38, "m"))
    b.append(cont(368, 40, 272, 160, "h", "Between nodes"))
    b.append(box(390, 94, 110, 78, "u", "node A", rx=4).replace('class="lbl"', 'class="sub"'))
    b.append(box(510, 94, 110, 78, "u", "node B", rx=4).replace('class="lbl"', 'class="sub"'))
    b.append(txt(62, 218, "eight GPUs on NVLink", "sub2"))
    b.append(txt(390, 218, "InfiniBand or Ethernet", "sub2"))
    X0, SC = 200, 0.2                                   # px per GB/s
    rows = [("NVLink, B200", nvb, "s", "1.8 TB/s"), ("NVLink, H100", nvh, "s", "900 GB/s"),
            ("network", net, "h", None)]
    for k, (lab, v, c, inside) in enumerate(rows):
        y = 244 + k * 38
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, v * SC, 26, c, label=inside))
        if inside is None:
            b.append(txt(X0 + v * SC + 10, y + 18, "about 50 GB/s", "sub2"))
    body, yb = prose(394, [
        "Inside one server, a node, GPUs, typically eight of them, are wired to each other over "
        "NVLink, Nvidia's dedicated GPU-to-GPU interconnect: 900 GB/s on an H100, 1.8 TB/s on a "
        "B200. Step outside the box and traffic leaves through the data-centre network instead, "
        "InfiniBand or Ethernet, at about 50 GB/s: 18 to 36 times slower, as the specifications are "
        "usually quoted.",
        "Nvidia's newest rack-scale systems stretch one NVLink domain across 72 GPUs "
        "({{fig:v02-o097}}), but the shape is the same: wherever the domain ends, the drop is "
        "waiting. Heavy, constant traffic must stay inside the fast domain; only thin, occasional "
        "traffic can afford to cross.",
    ])
    emit("o008", stamp(SRT, "The hardware these patterns run on"),
         "Fast inside a box, a cliff at its edge", yb + 26, b + [body],
         "Bars to scale. This one gap governs the whole layout; the next figure checks how big it "
         "really is.")


# ---- N7: bits against bytes, one direction against two -------------------------------------------
def n7():
    port_gb = 400 / 8
    h_each, b_each, net = NVL_H100_EACH_WAY / 1e9, NVL_B200_EACH_WAY / 1e9, NET_EACH_WAY / 1e9
    assert port_gb == net == 50 and h_each == 450 and b_each == 900
    assert h_each / net == 9 and b_each / net == 18
    b = [hd(40, 40, "Network ports are sold in bits per second, one direction at a time")]

    def chain(y, parts):
        x = 40
        for k, (s, cls, w) in enumerate(parts):
            if cls == "op":
                b.append(txt(x + w / 2, y + 21, s, "sub2", "middle"))
            else:
                b.append(cell(x, y, w, 32, cls, label=s))
            x += w
    chain(56, [("400 Gb/s", "u", 110), ("÷", "op", 30), ("8 bits per byte", "u", 130), ("=", "op", 30),
               ("50 GB/s each way", "h", 150)])
    b.append(hd(40, 128, "NVLink's headline adds both directions together"))
    chain(144, [("18 links", "u", 90), ("×", "op", 30), ("25 GB/s each way", "u", 140), ("=", "op", 30),
                ("450 GB/s each way", "s", 150), ("× 2 = 900", "op", 100)])
    X0, SC = 200, 0.4
    rows = [("NVLink, B200", b_each, "s", "900 GB/s each way"), ("NVLink, H100", h_each, "s",
            "450 GB/s each way"), ("network port", net, "h", None)]
    b.append(hd(40, 222, "Like for like, per direction"))
    for k, (lab, v, c, inside) in enumerate(rows):
        y = 238 + k * 38
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, v * SC, 26, c, label=inside))
        if inside is None:
            b.append(txt(X0 + v * SC + 10, y + 18, "50 GB/s each way", "sub2"))
    body, yb = prose(388, [
        "A network port is sold in bits per second; GPU memory and NVLink in bytes. A byte is eight "
        "bits ({{fig:v01-o073}}), so a 400 Gb/s InfiniBand or Ethernet port, one per GPU in "
        "Nvidia's B200 servers, moves 50 GB/s. It does that in both directions at once, and is "
        "quoted one way.",
        f"NVLink's figure is quoted both ways added. An H100 has 18 links, each moving 25 GB/s each "
        f"way: {h_each:.0f} GB/s out while {h_each:.0f} GB/s comes in, 900 in total. A B200 doubles "
        f"it: {b_each:.0f} + {b_each:.0f} = 1.8 TB/s.",
        f"So the like-for-like drop at the edge of the box is {h_each:.0f} ÷ 50 = "
        f"{h_each / net:.0f} times on an H100 and {b_each:.0f} ÷ 50 = {b_each / net:.0f} times on a "
        "B200. The quoted 18 to 36 compares a two-way total with a one-way rate.",
    ])
    emit("n7", stamp(SRT, "Step outside the box"),
         "Gigabits are not gigabytes, and two directions are not one", yb + 26, b + [body],
         "Bars to scale. The usual 18 to 36 times is how the specifications read side by side; the "
         "fair comparison is half that. Nine to eighteen times is still a cliff.")


# ---- N8: the fixed toll --------------------------------------------------------------------------
def sig(v):
    """Two significant figures below 10, whole numbers above."""
    return f(v, 3) if v < 0.1 else f(v, 2 if v < 1 else 1 if v < 10 else 0)


def n8():
    sizes = [(VEC, "16 KB: one token's vector"), (64 * VEC, "1 MB: 64 tokens"),
             (4096 * VEC, "67 MB: 4,096 tokens")]
    us = [(s / NVL_H100_EACH_WAY * 1e6, s / NET_EACH_WAY * 1e6) for s, _ in sizes]
    assert [round(a, 3) for a, _ in us][:1] == [0.036] and round(us[0][1], 2) == 0.33
    assert round(us[2][0]) == 149 and round(us[2][1]) == 1342
    b = [hd(40, 40, "time  =  a fixed toll  +  size ÷ bandwidth")]
    b.append(txt(290, 70, "size ÷ 450 GB/s, NVLink", "sub2"))
    b.append(txt(470, 70, "size ÷ 50 GB/s, network", "sub2"))
    for k, ((s, lab), (a, c)) in enumerate(zip(sizes, us)):
        y = 82 + k * 34
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(290, y, 150, 26, "u", label=f"{sig(a)} µs"))
        b.append(cell(470, y, 150, 26, "u", label=f"{sig(c)} µs"))
    b.append(hd(40, 214, "The same two parts, for a small and a big message (schematic)"))
    X0 = 200
    b.append(txt(40, 250, "a 16 KB message", "cap"))
    b.append(cell(X0, 232, 230, 26, "h", label="the toll"))
    b.append(cell(X0 + 232, 232, 3, 26, "u"))
    b.append(txt(X0 + 244, 250, "the bytes", "sub2"))
    b.append(txt(40, 290, "a 67 MB message", "cap"))
    b.append(cell(X0, 272, 10, 26, "h"))
    b.append(cell(X0 + 12, 272, 410, 26, "u", label="the bytes, at the link's bandwidth"))
    body, yb = prose(338, [
        "Sending anything has a fixed cost before the first byte moves. The exchange runs as a GPU "
        "program that has to be launched, a few microseconds each ({{fig:v03-o096}}), and the GPUs "
        "must agree that the data is ready. After that, bytes flow at the link's bandwidth.",
        "For a 16 KB message on NVLink the bandwidth part is 36 nanoseconds, shorter than a single "
        "read from the chip's own memory ({{fig:v02-o010}}). Whatever the toll comes to, a message "
        "that small is almost all toll; a 67 MB one is almost all bandwidth.",
        "So 'how often' matters as much as 'how much'. A strategy that sends little but often pays "
        "mostly in tolls, however fast the link.",
    ])
    emit("n8", stamp(SRT, "That single gap governs the layout"),
         "Every exchange pays a fixed toll before the first byte moves", yb + 26, b + [body],
         "Bandwidth times exact; the toll is drawn schematic, because it depends on the library and "
         "the system. Count exchanges, not just bytes.")


if __name__ == "__main__":
    for fn in (o006, o007, n3, n4, n5, n6, o008, n7, n8):
        fn()
