"""V2 Part 6, why memory is slow: the old Part 2 moved to 7:44, where the video says "The reason is
physical". Figs 15-17 become two figures (the two cells; read and refresh), Fig 20 gets measured
numbers, and Figs 18 and 50 are merged.

  python3 figures/V02/src/physics.py     writes o016 o017 o020; edits o018
"""
from common import *  # noqa: F401,F403

TREFW_MS, TREFW_HOT_MS, REF_CMDS = 64, 32, 8192        # MICRON: 64 ms, 8192-cycle refresh; 32 ms at 85-95 C
TRCD_NS = CL_NS = 13.75                                # MICRON DDR4-3200: open a row; read a column


def o016():
    b = [hd(40, 46, "An SRAM cell: six transistors")]
    for r in range(2):
        for c in range(3):
            b.append(cell(60 + c * 46, 66 + r * 46, 38, 38, "s", rx=4))
    b.append(txt(60, 178, "two loops that hold each other's state", "sub2"))
    b.append(txt(60, 196, "read in one cycle, without disturbing it", "sub2"))
    b.append(hd(370, 46, "A DRAM cell: one transistor, one capacitor"))
    b.append(cell(390, 66, 38, 38, "h", rx=4))
    b.append(cell(444, 66, 60, 38, "h", rx=8, label="C"))
    b.append(txt(390, 130, "the bit is a tiny charge on C", "sub2"))
    b.append(txt(390, 148, "full is 1, empty is 0", "sub2"))
    b.append(hd(40, 240, "Left alone, the capacitor's charge leaks away"))
    b.append(ln(60, 352, 480, 352, "axis"))
    b.append('<polyline class="pl-h" points="66,276 140,290 220,312 320,334 460,346"/>')
    b.append(ln(60, 318, 480, 318, "tick"))
    b.append(txt(490, 322, "below this, it reads as 0", "sub2"))
    b.append(txt(66, 268, "full", "sub2"))
    b.append(txt(470, 370, "time", "sub2", "end"))
    body, yb = prose(406, [
        "Six transistors per bit against one transistor and one capacitor. DRAM is therefore far denser "
        "and cheaper per bit, which is how 80 GB fits beside the chip, and SRAM is what the chip itself "
        "is built from.",
        "But a capacitor holds a charge the way a leaky bucket holds water. A DRAM cell has to be topped "
        "up on a timer, and reading it is harder than reading an SRAM cell, as the next figure shows.",
        "That is the whole reason for a hierarchy: no technology has both density and speed, so machines "
        "use a little of the fast kind and a lot of the dense kind.",
    ])
    emit("o016", stamp(SRT, "The reason is physical"),
         "SRAM holds a bit in six transistors; DRAM holds it as charge on one capacitor", yb + 24, b + [body],
         "The leak curve is schematic. Every rung of the ladder in the next part is a consequence of this "
         "one trade in silicon.")


def o017():
    per_s, per_s_hot = 1000 / TREFW_MS, 1000 / TREFW_HOT_MS
    trefi_us = TREFW_MS * 1000 / REF_CMDS
    assert round(per_s, 1) == 15.6 and round(per_s_hot) == 31 and round(trefi_us, 1) == 7.8
    b = [hd(40, 46, "Reading a DRAM cell uses up what it read")]
    b.append(box(40, 66, 170, 40, "h", "charge sits"))
    b.append(arr(214, 86, 236, 86))
    b.append(box(240, 66, 190, 40, "u", "read: it drains out"))
    b.append(arr(434, 86, 456, 86))
    b.append(box(460, 66, 180, 40, "m", "write it back"))
    b.append(hd(40, 160, "And every row is rewritten on a timer, read or not"))
    X0, PX = 60, 2.6                                    # ms 0 at X0
    top, bot = 186, 266
    pts = []
    for k in range(3):
        t0 = k * TREFW_MS
        pts += [(t0, top), (t0 + TREFW_MS, top + 0.45 * (bot - top))]
    poly = []
    for (t, y) in pts:
        poly.append(f"{X0 + t * PX:.1f},{y:.1f}")
    seg = " ".join(poly)
    b.append(f'<polyline class="pl-h" points="{seg}"/>')
    b.append(ln(X0, bot, X0 + 3 * TREFW_MS * PX + 20, bot, "axis"))
    for k in range(4):
        x = X0 + k * TREFW_MS * PX
        b.append(vline(x, bot, bot + 5))
        b.append(txt(round(x, 1), bot + 20, f"{k * TREFW_MS} ms", "sub2", "middle"))
    b.append(txt(X0 + 3 * TREFW_MS * PX + 30, top + 26, "each jump up:", "sub2"))
    b.append(txt(X0 + 3 * TREFW_MS * PX + 30, top + 44, "the row rewritten", "sub2"))
    b.append(txt(X0 + 3 * TREFW_MS * PX + 30, top + 62, "back to full", "sub2"))
    body, yb = prose(bot + 64, [
        "The charge is tiny, so measuring it drains it. Every read is a read followed by a rewrite, and "
        "the row is busy until the rewrite finishes.",
        f"Charge also leaks, so the memory rewrites every row on a timer. A standard DRAM chip keeps its "
        f"data only if every row is refreshed within {TREFW_MS} ms, or {TREFW_HOT_MS} ms above 85 °C. It "
        f"does this with {REF_CMDS:,} refresh commands per window, one every {trefi_us:.1f} µs, each "
        f"covering a slice of the rows: about {round(per_s)} complete rewrites a second ({round(per_s_hot)} "
        "when hot), whether or not anybody is reading.",
    ])
    emit("o017", stamp(SRT, "The reason is physical"),
         "Reading DRAM destroys the bit, and every row must be rewritten every 64 ms", yb + 24, b + [body],
         "Refresh times from Micron's DDR4 datasheet; the decay drawn is schematic. These are the price of "
         "density: they make DRAM slower to answer, but they do not cap its bandwidth, which comes from "
         "wires.")


def o020():
    lat_ns = LAT["hbm"] / H800_CLK * 1e9
    cell_ns = TRCD_NS + CL_NS
    assert 270 < lat_ns < 275 and cell_ns == 27.5 and cell_ns / lat_ns < 0.11
    b = [hd(40, 46, "One load from HBM, in nanoseconds, drawn to scale")]
    SC = 440 / lat_ns
    b.append(txt(40, 84, "whole load", "cap"))
    b.append(cell(170, 66, lat_ns * SC, 28, "h", label=f"about {round(lat_ns)} ns, measured"))
    b.append(txt(40, 128, "cell's own work", "cap"))
    b.append(rect(170, 110, cell_ns * SC, 28, "s"))
    b.append(txt(170 + cell_ns * SC + 10, 128, f"{cell_ns:g} ns: open a row, read a column", "sub2"))
    body, yb = prose(186, [
        f"In a standard DRAM chip, opening a row takes {TRCD_NS:g} ns and reading a column from the open row "
        f"another {CL_NS:g} ns. A load from a Hopper GPU's HBM was measured at about {round(lat_ns)} ns, "
        f"ten times longer.",
        "Most of the wait is the journey: checking the caches on the way for a copy, crossing the chip to "
        "the right memory controller, queuing there, and coming back. The charge is a small part.",
        "None of that shrinks when the bus gets wider. More wires carry more at once; they do not "
        "shorten the trip. That is why bandwidth and latency move independently across generations.",
    ])
    emit("o020", stamp(SRT, "The reason is physical"), "Why latency does not improve with a wider bus",
         yb + 24, b + [body],
         "Bars to scale. The cell timings are Micron's for DDR4-3200, standing in for HBM, which is built "
         "from the same kind of DRAM cell; the load was measured by Luo et al. 2024.")


def o018():
    edit_item("o018", from_y=330, paras=[
        "Nothing sits in the top right. No technology is both the fastest and the largest: the fast kind "
        "is not dense, and the dense kind is not fast.",
        "There is also geometry. Fast means close, and only a little of anything can be close to a given "
        "point. Making a memory bigger necessarily puts most of it further away. Even 80 GB at register "
        "speed, if the cells allowed it, could not all be next to the arithmetic.",
        "So the only sensible design is a ladder: a very little of the fast kind, a great deal of the slow "
        "kind, and machinery to move things between them. The four rungs that follow are that ladder.",
    ], caption="Positions are illustrative, the empty corner is not. Speed needs proximity and capacity needs "
               "area, two reasons that each alone would force a hierarchy.", ts=stamp(SRT, "ladder of four levels"))


if __name__ == "__main__":
    o016()
    o017()
    o020()
    o018()
