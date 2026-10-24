"""V3 Part 17, what stayed fixed: §5a item 7 (exactness in o099 and o100), §5c voice (o098-o100), §5e (o100's
staircase becomes a two-column table), §2a (FP4 at 46:56-47:06). All three ids kept (V8 links to o099).

  o098  the width of each number, the last lever: 16, 8 and 4 bits; why the headline stays at 16 (46:24)
  o099  exact up to rounding is what makes a kernel change safe to deploy (47:43)
  o100  everything that moved, and the one thing that did not: the two-column table (48:08)

  python3 figures/V03/src/fixed.py
"""
from common import *  # noqa: F401,F403


def o098():
    widths = [("16-bit, BF16", 2.0, "u", "the headline numbers of versions 3 and 4"),
              ("8-bit, FP8", 1.0, "m", "Hopper's tensor cores; version 3's FP8 path"),
              ("4-bit, FP4", 0.5, "s", "Blackwell's tensor cores reach this far")]
    b = [hd(40, 46, "Bytes per number, and so bytes moved per number (bars to scale)")]
    SC = 200 / 2.0
    for k, (lab, by, cls, what) in enumerate(widths):
        y = 66 + k * 38
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(hbar(170, y, by * SC, 26, cls, f"{by:g} byte" + ("s" if by != 1 else ""), 90))
        b.append(txt(390, y + 17, what, "sub2"))
    body, yb = prose(66 + 3 * 38 + 30, [
        "The levers so far: kernel intermediates, cache layout, cache size, parallel cache reads and launch "
        "overhead. Each made the bytes cheaper to move or rarer to need. One lever remains, which version 4's "
        "BF16 headline already hinted at: the width of each number itself.",
        "It follows the same logic. Wall-clock time tracks bytes moved, so cutting each number from 16 bits "
        "to 8 halves the memory traffic outright, and the arithmetic gets cheaper too, because fewer bits per "
        "operand means more tensor-core operations in each cycle. Hopper's tensor cores run FP8; Blackwell's "
        "reach down to 4-bit FP4.",
        f"Yet version 4's headline numbers still run in BF16. Accuracy gives out before the hardware floor is "
        f"reached: even at 8 bits, holding the error down took everything in Part {PART['fp8']}, a separate "
        "scale for every block and outliers spread out by random rotations. Lower precision is faster, but "
        "accuracy fails first; steering between the two is the discipline called quantization, the subject "
        "of {{ref:v04-o001}} onwards.",
    ])
    figure("o098", st("One lever remains"), "Precision as the last lever", yb + 30, b + [body],
           esc("The one lever whose limit is not set by engineering: how few bits the model's numbers can lose "
               "is a question about the model, not about the kernel."))


def o099():
    b = [hd(40, 46, "Versions 1 to 4, each in its headline precision, compute one function")]
    b.append(eq(40, 62, 600, "O = softmax(Q Kᵀ ÷ √d) V,  row by row", "s", 38))
    for k in range(4):
        b.append(cell(40 + k * 152, 116, 144, 30, "u", label=f"version {k + 1}"))
    b.append(txt(40, 172, "identical up to the order in which floating-point sums are added", "sub2"))
    body, yb = prose(212, [
        "Four generations of FlashAttention compute exact attention: the same S = QKᵀ, the same row-wise "
        "softmax, the same multiply by V, identical up to the reordering of floating-point sums "
        "({{fig:v03-p12}}). Across four generations the function never moved.",
        "That is what makes a kernel change safe to deploy. The same inputs give the same outputs, to the last "
        "bits rounding allows, so a better kernel can be switched on under a model already in production "
        "without retesting what the model says.",
        "Version 4's polynomial exponential is an approximation, but one held within a single BF16 rounding "
        "step of the hardware's result on 99% of inputs ({{fig:v03-o080}}), so it counts with the rounding. "
        "FP8 storage, fewer KV heads and latent compression are different in kind: they change the numbers or "
        "the model itself, and their effect on quality has to be measured.",
    ])
    figure("o099", st("look at what stayed fixed"), "Exactness is what makes these safe to deploy", yb + 30,
           b + [body],
           esc("The property that separates a kernel improvement from a model change, and the reason the kernel "
               "improvements in this atlas spread so quickly."))


def o100():
    same = [("tiling", "keeps the n × n scores out of HBM"),
            ("online softmax", "two running numbers per row make tiling legal"),
            ("recomputation", "13% more arithmetic, the same result"),
            ("asynchrony", "copies and arithmetic overlap instead of taking turns"),
            ("the polynomial", "exponentials on idle cores, within one BF16 step"),
            ("paging", "moves the cache without touching the arithmetic"),
            ("splitting the cache", "one token reads it with the whole chip"),
            ("graph replay", "cuts the bookkeeping between kernels")]
    changed = [("grouped and multi-query heads", "fewer KV heads: a different model"),
               ("latent compression, MLA", "stores a latent: a different model"),
               ("FP8, and narrower still", "different numbers, error measured")]
    b = [hd(40, 46, "What moved, sorted by whether the output can change")]
    b.append(cont(40, 62, 600, 52 + len(same) * 34, "s", "same function, up to rounding"))
    for k, (name, what) in enumerate(same):
        y = 62 + 52 + k * 34
        b.append(txt(62, y, name, "cap"))
        b.append(txt(230, y, what, "sub2"))
    y2 = 62 + 52 + len(same) * 34 + 22
    b.append(cont(40, y2, 600, 52 + len(changed) * 34, "h", "a different model, or different numbers"))
    for k, (name, what) in enumerate(changed):
        y = y2 + 52 + k * 34
        b.append(txt(62, y, name, "cap"))
        b.append(txt(290, y, what, "sub2"))
    y3 = y2 + 52 + len(changed) * 34 + 10
    body, yb = prose(y3 + 30, [
        "Tiling kept the n × n score matrix out of HBM entirely; the online softmax made that legal by carrying "
        "two running numbers per row; asynchrony let the copies and the arithmetic overlap; and when the "
        "exponential unit saturated, a polynomial on the idle multiply-add units routed the work around it. "
        "Beyond the kernel the pattern held: paging moved the cache, splitting let one token read it in "
        "parallel, graph replay cut the bookkeeping. None of those changed the model's output.",
        "Grouping and latent compression were the exception: they shrank the cache by changing the model "
        "itself, what attention stores in the first place. The tensor cores began mostly idle, stalled on "
        f"memory, and by version 4 run at nearly three quarters of peak ({{{{fig:v03-o081}}}}). Every point of "
        "that climb came from changing the route the bytes take.",
    ])
    figure("o100", st("What moved was the route"), "Everything that moved, and the one thing that did not",
           yb + 30, b + [body],
           esc("Operations are fixed by the mathematics; bytes are a scheduling decision, and that decision is "
               "where the performance lives."))


if __name__ == "__main__":
    for job in (o098, o099, o100):
        job()
