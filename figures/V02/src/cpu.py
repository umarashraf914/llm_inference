"""V2 Part 2, two design philosophies: review proposals 3 and 4, and the fixes to Figs 22, 23, 26.

  python3 figures/V02/src/cpu.py     writes p03 p04; edits o022 o023 o026
"""
from common import *  # noqa: F401,F403

SL, CW = 36, 32                      # one slot of the lane chart, and a cell's width inside it


def slot(k):
    return 200 + k * SL


# ---- p03: branch prediction and prefetching, as lane charts ---------------------------------------
def p03():
    b = [hd(40, 46, "Guessing a branch: the answer to the test arrives three slots late")]
    rows = [("wait", ["i1", "i2", "i3", "if?", None, None, None, "i5", "i6", "i7", "i8"]),
            ("guess right", ["i1", "i2", "i3", "if?", "i5", "i6", "i7", "i8", "i9", "i10", "i11"]),
            ("guess wrong", ["i1", "i2", "i3", "if?", "x", "x", "x", "e5", "e6", "e7", "e8"])]
    RESOLVE = 7                                    # slot where the branch's answer is known
    for r, (lab, cells) in enumerate(rows):
        y = 66 + r * 40
        b.append(txt(40, y + 18, lab, "cap"))
        for k, c in enumerate(cells):
            x = slot(k)
            if c is None:
                b.append(ghost(x, y, CW, 26))
            elif c == "x":
                b.append(ghost(x, y, CW, 26, label="i" + str(k + 1)))
            elif c == "if?":
                b.append(cell(x, y, CW, 26, "u", label=c))
            else:
                b.append(cell(x, y, CW, 26, "h" if c.startswith("e") else "m", label=c))
    xr = slot(RESOLVE) - (SL - CW) / 2
    b.append(ln(xr, 58, xr, 66 + 3 * 40 - 6, "mark"))
    b.append(txt(xr + 6, 66 + 3 * 40 + 10, "answer known", "sub2"))
    b.append(hd(40, 236, "Prefetching: the core spots a pattern in the addresses and fetches ahead"))
    asked = [100, 104, 108]
    b.append(txt(40, 272, "asked for", "cap"))
    for k, a in enumerate(asked):
        b.append(cell(200 + k * 62, 254, 54, 26, "u", label=str(a)))
    b.append(txt(388, 272, "+4 each time, so", "sub2"))
    for k, a in enumerate((112, 116)):
        b.append(cell(500 + k * 62, 254, 54, 26, "s", label=str(a)))
    b.append(txt(500, 300, "fetched before anyone asks", "sub2"))
    y1, y2 = 324, 364
    b.append(txt(40, y1 + 18, "no prefetch", "cap"))
    b.append(cell(slot(0), y1, CW, 26, "u", label="ask"))
    b.append(ghost(slot(1), y1, 6 * SL - (SL - CW), 26, label="wait for memory"))
    b.append(cell(slot(7), y1, CW, 26, "m", label="use"))
    b.append(txt(40, y2 + 18, "prefetched", "cap"))
    b.append(cell(slot(0), y2, CW, 26, "m", label="use"))
    b.append(txt(slot(1) + 4, y2 + 18, "112 is already waiting nearby", "sub2"))
    body, yb = prose(430, [
        "A branch tests a value, and the value may not be ready yet. Rather than stall, the core guesses "
        "which way the test will go and runs ahead. Right, and the work was free. Wrong, and it is thrown "
        "away and the core restarts down the other path, no later than if it had waited.",
        "Prefetching makes the same bet about data: a core that sees addresses 100, 104, 108 asked for in "
        "turn fetches 112 and 116 before they are wanted, so those loads find their data close by.",
        "Both cost silicon: tables of past branches, address trackers, room to hold half-finished guesses.",
    ])
    emit("p03", stamp(SRT, "guessing what the thread will do next"),
         "A CPU runs ahead on a guess, and throws the work away when it guessed wrong", yb + 24, b + [body],
         "Schematic timings. This is what anticipation means: machinery that pays off for one thread "
         "making unpredictable turns. A GPU spends that silicon on more threads instead.")


# ---- p04: architecture, chip, system ---------------------------------------------------------------
def p04():
    b = [hd(40, 46, "A design, the chips built to it, and the boxes that hold them")]
    cols = [(40, 160, "architecture, year"), (224, 140, "chips"), (388, 252, "systems")]
    for x, w, s in cols:
        b.append(txt(x, 78, s, "sub2"))
    data = [("Volta, 2017", "V100", None),
            ("Ampere, 2020", "A100", "DGX: 8 GPUs, one NVLink domain"),
            ("Hopper, 2022", "H100, H200", "DGX: 8 GPUs, one NVLink domain"),
            ("Blackwell, 2024", "B200, GB200", "GB200 NVL72: 72 GPUs in one rack")]
    for r, (arch, chips, system) in enumerate(data):
        y = 92 + r * 48
        hot = arch.startswith("Hopper")
        b.append(cell(40, y, 160, 34, "m" if hot else "u", rx=6, label=arch))
        b.append(arr(202, y + 17, 220, y + 17))
        b.append(cell(224, y, 140, 34, "m" if hot else "u", rx=6, label=chips))
        if system:
            b.append(arr(366, y + 17, 384, y + 17))
            b.append(cell(388, y, 252, 34, "u", rx=6, label=system))
    b.append(txt(40, 92 + 4 * 48 + 8, "gold: Hopper and the H100, the chip used throughout this atlas", "sub2"))
    body, yb = prose(92 + 4 * 48 + 48, [
        "An architecture is a design: how a multiprocessor is laid out, which number formats its tensor "
        "cores accept. Hopper is NVIDIA's 2022 design. A chip is one product built to it: the H100 has "
        "132 multiprocessors and 80 GB of memory, and the H200 is the same chip with more and faster "
        "memory.",
        "Systems are what get bought and wired together. A DGX box holds eight GPUs joined by NVLink. "
        "A GB200 superchip pairs one Grace CPU with two Blackwell GPUs, and an NVL72 rack holds 36 of "
        "them, 72 GPUs in one NVLink domain.",
    ])
    emit("p04", stamp(SRT, "is built on Hopper"), "Hopper is the design, H100 is the chip, NVL72 is the rack",
         yb + 24, b + [body],
         "Three kinds of name that the specification sheets mix freely. Later parts compare generations "
         "by architecture and chips by product name, so the distinction carries a lot of weight.")


def fixes():
    edit_item("o022", caption="Schematic: the split of area is illustrative, not measured. Most of the die "
              "goes to guessing what the thread will do next and lining the data up before it asks, so the "
              "core almost never stops and waits.")
    edit_item("o023", caption="Schematic, like the previous figure, and not the same budget: one CPU core "
              "against one of 132 multiprocessors. The GPU does not avoid waiting; it arranges to always have "
              "other work ready.")
    edit_item("o026", from_y=200, paras=[
        "For the first, a thousand slow lanes finish far sooner than four fast ones. For the second, "
        "nine hundred and ninety-nine of those lanes have nothing to do.",
        "A chain runs at the speed of one lane, and one GPU lane is much slower than one CPU core.",
        "Tokens do form a chain, since each needs the one before. But every link is a full pass through "
        f"the model: one 4,096 × 4,096 matrix times a vector alone is {4096 * 4096:,} independent "
        "multiply-adds. The lanes have plenty to do. What starves them in decode is that each weight "
        "fetched is used once ({{fig:v01-o112}}).",
    ], caption="The trade is not free for genuinely serial work. Decode is not that: its chain is long but "
               "every link is wide, and what it lacks is reuse of each byte, not parallel work.")


if __name__ == "__main__":
    p03()
    p04()
    fixes()
