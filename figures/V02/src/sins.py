"""V2 Part 5, the two cardinal sins: Figs 47 and 48 merged (o048 rewritten, o047 dropped).

  python3 figures/V02/src/sins.py     writes o048
"""
from common import *  # noqa: F401,F403


def o048():
    b = [hd(40, 46, "The active mask: one bit per lane, 8 of the 32 drawn")]
    mask = [1, 1, 1, 1, 0, 0, 0, 0]
    for k, bit in enumerate(mask):
        b.append(cell(150 + k * 48, 62, 40, 30, "m" if bit else "u", label=str(bit)))
    b.append(txt(150, 116, "a 0 lane still takes its slot, then throws its result away", "sub2"))
    b.append(hd(40, 160, "Useful share of the lanes' slots, if every fork splits the warp in half"))
    rows = [("no fork", 1), ("one fork", 2), ("two, nested", 4), ("three, nested", 8)]
    for k, (lab, passes) in enumerate(rows):
        y = 176 + k * 36
        share = 1 / passes
        w = share * 400
        note = f"{share:.1%}".replace(".0%", "%") + f" useful: {passes} pass" + ("es" if passes > 1 else "")
        b.append(txt(40, y + 18, lab, "cap"))
        if w > tw(note) + 30:
            b.append(cell(170, y, w, 26, "m", label=note))
        else:
            b.append(rect(170, y, w, 26, "m"))
            b.append(txt(170 + w + 10, y + 18, note, "sub2"))
    assert [1 / p for _, p in rows] == [1, 0.5, 0.25, 0.125]
    body, yb = prose(176 + 4 * 36 + 36, [
        "The hardware keeps a bitmask of which lanes are active. Inactive lanes still occupy their place "
        "in the instruction; they simply discard the answer. Nothing waits and nothing is recomputed, yet "
        "time passes with only some of the lanes doing useful work.",
        "The cost is not the decision itself. One instruction stream cannot serve two destinations at "
        "once, so it serves them one after the other. Each nested fork doubles the passes: one fork "
        "means two, two nested forks four, three make eight.",
        "So well-written kernels avoid branching on data inside a warp. A fork costs nothing when all 32 "
        "lanes go the same way.",
    ])
    emit("o048", stamp(SRT, "nesting branches only compounds"), "Masked lanes still take their turn, so each nested fork halves the useful work",
         yb + 24, b + [body],
         "Bars to scale. Divergence is not a stall: it is issue slots spent on lanes that discard their "
         "results, which is why it shows up as lost throughput, never as waiting.")


if __name__ == "__main__":
    o048()
