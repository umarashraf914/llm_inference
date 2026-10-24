"""V3 Part 10, Hopper and FlashAttention 3: §5d merge 73+74; review #20 and #21; one extra ground-floor figure
(n06, overlap in numbers).

  p20   a warpgroup is four warps issuing one matrix multiply (20:54)
  n06   doing load and compute in turn costs their sum; overlapping costs the larger (21:33)
  o073  warp specialisation: producers, a ring of buffers, consumers (merges o074)
  p21   three units busy at once: the multi-function unit, and pingpong (22:29)
  patches: o071, o072 restamped

  python3 figures/V03/src/hopper.py
"""
from common import *  # noqa: F401,F403


# ---- p20: the thread hierarchy, with the warpgroup ---------------------------------------------------
def p20():
    assert 4 * 32 == 128
    b = [hd(40, 46, "Who issues what, from the whole launch down to one thread")]
    b.append(cont(40, 62, 600, 300, "u", "grid: the whole launch, every thread block of one kernel"))
    b.append(cont(62, 110, 556, 238, "u", "cluster: thread blocks placed on neighbouring multiprocessors"))
    b.append(cont(84, 158, 512, 176, "m", "thread block: runs on one multiprocessor, shares its SRAM"))
    b.append(cont(106, 206, 468, 114, "s", "warpgroup: 4 warps, 128 threads, issue one WGMMA together"))
    for w in range(4):
        b.append(box(128 + w * 110, 252, 100, 52, "s", f"warp {w + 1}", "32 threads"))
    body, yb = prose(392, [
        "Threads run in warps of 32 that move in lockstep ({{fig:v02-o037}}), and a thread block is the "
        "group of warps placed on one multiprocessor ({{fig:v03-o004}}). Hopper adds a level between them: "
        "the warpgroup, four consecutive warps, 128 threads. Its tensor-core instruction, WGMMA, is issued "
        "by a whole warpgroup at once, and it is asynchronous: it starts a matrix multiply on a tile and lets "
        "the warps move on to other work while it runs.",
        "Hopper also groups thread blocks into clusters placed on neighbouring multiprocessors, which can "
        f"reach each other's shared memory. Version 4 uses pairs of them (Part {PART['fa4']}).",
    ])
    figure("p20", st("four warps acting as one"), "A warpgroup is four warps issuing one matrix multiply",
           yb + 30, b + [body],
           esc("Nested, because each level really contains the next. The new level matters for one reason: the "
               "unit that issues a matrix multiply is now big enough to keep Hopper's tensor cores busy."))


# ---- n06: in turn, or overlapped -------------------------------------------------------------------------
def n06():
    L, Cc, N = 1.0, 1.5, 6                         # illustrative durations per tile: load, compute
    turn = N * (L + Cc)
    over = L + N * max(L, Cc)
    assert (turn, over) == (15.0, 10.0) and round(N * Cc / turn, 2) == 0.6 and round(N * Cc / over, 2) == 0.9
    X0, SC = 150, 470 / turn
    b = [hd(40, 46, f"Six tiles: load each, compute on it (durations illustrative: {L:g} and {Cc:g})")]

    def lane(y, label, spans, cls):
        o = [txt(40, y + 15, label, "cap")]
        for a, z, lab in spans:
            o.append(cell(X0 + a * SC, y, (z - a) * SC - 2, 22, cls, rx=2, label=lab))
        return "".join(o)
    b.append(txt(40, 84, "in turn", "hd"))
    loads = [(k * (L + Cc), k * (L + Cc) + L, f"{k + 1}") for k in range(N)]
    comps = [(k * (L + Cc) + L, (k + 1) * (L + Cc), f"{k + 1}") for k in range(N)]
    b.append(lane(96, "copy engine", loads, "h"))
    b.append(lane(124, "tensor cores", comps, "s"))
    b.append(txt(X0 + turn * SC, 166, f"{turn:g} units", "sub2", "end"))
    b.append(txt(40, 204, "overlapped", "hd"))
    loads2 = [(k * Cc if k else 0, (k * Cc if k else 0) + L, f"{k + 1}") for k in range(N)]
    comps2 = [(L + k * Cc, L + (k + 1) * Cc, f"{k + 1}") for k in range(N)]
    b.append(lane(216, "copy engine", loads2, "h"))
    b.append(lane(244, "tensor cores", comps2, "s"))
    b.append(txt(X0 + over * SC, 286, f"{over:g} units", "sub2", "start"))
    body, yb = prose(324, [
        f"Done in turn, each tile costs its load plus its compute, and the units take turns being idle: "
        f"{N} × ({L:g} + {Cc:g}) = {turn:g} units, with the tensor cores busy {100 * N * Cc / turn:.0f}% of "
        "the time. Overlapped, the next tile loads while the current one is computed, and each tile costs only "
        f"the longer of the two: {L:g} + {N} × {Cc:g} = {over:g} units, tensor cores busy "
        f"{100 * N * Cc / over:.0f}%.",
        "Overlap needs hardware that can start a job and let go of it: a copy engine that moves tiles on "
        "its own, and a matrix multiply that runs while the warps do something else. Hopper has both, the "
        "TMA ({{fig:v02-o035}}) and WGMMA. Version 2, written for the A100, did its loads and its "
        "arithmetic strictly in turn.",
    ])
    figure("n06", st("strictly in turn"), "In turn costs the sum; overlapped costs the larger", yb + 30,
           b + [body],
           esc("Durations are illustrative; the shape is not. Whichever job is longer sets the pace, and the "
               "other one is hidden behind it for free."))


# ---- o073: warp specialisation ----------------------------------------------------------------------------
def o073():
    stages = 2
    b = [hd(40, 46, "Producers fill a ring of shared-memory slots; consumers empty it")]
    b.append(box(40, 74, 170, 64, "h", "producer warps", "only issue TMA loads", "of K and V tiles"))
    b.append(arr(216, 106, 246, 106))
    b.append(cont(252, 64, 176, 84, "u", f"a ring of {stages} slots"))
    for k in range(stages):
        b.append(box(270 + k * 80, 96, 66, 36, "s", f"slot {k + 1}"))
    b.append(arr(434, 106, 464, 106))
    b.append(box(470, 74, 170, 64, "m", "consumer warps", "only compute: WGMMA", "and the softmax"))
    b.append(txt(252, 172, "a producer waits only when the ring is full; a consumer only when it is empty",
                 "sub2"))
    body, yb = prose(210, [
        "The general pattern first: one party produces, another consumes, and a buffer between them lets "
        "both run. Neither waits for the other as long as the buffer is neither full nor empty. Operating "
        "systems have used it for decades.",
        "Version 3 builds it inside a single thread block. Instead of every warp doing every job, the warps "
        "divide by occupation. Producer warps do nothing but issue TMA loads, pulling the next tiles of K and "
        "V out of HBM into a ring of shared-memory slots. Consumer warps do nothing but compute on tiles that "
        "have landed, and free each slot when they are done with it.",
        "Issuing a copy takes almost no registers, so Hopper lets the producers hand most of theirs to the "
        "consumers, who need them for the tiles they work on. Data movement and computation finally overlap, "
        "each hiding the other.",
    ])
    figure("o073", st("specialization. Instead of every warp"), "Warp specialisation", yb + 30, b + [body],
           esc("A scheduling idea rather than a mathematical one, and the point where kernel engineering starts "
               "to look like systems programming: the arithmetic is unchanged, only who does what, and when."))


# ---- p21: three units busy at once ------------------------------------------------------------------------
def p21():
    exp_rate = MUFU_PER_CLK * H100_SMS * 1.83e9          # FA3 footnote 5: 16 per clock per SM, 132 SMs, 1830 MHz
    d = 128
    per_score_mm = 4 * d / H100_PEAK
    per_score_exp = 1 / exp_rate
    share = per_score_exp / per_score_mm
    assert round(exp_rate / 1e12, 1) == 3.9 and round(H100_PEAK / exp_rate) == 256 and round(share, 1) == 0.5
    X0, U = 160, 52
    b = [hd(40, 46, "Two warpgroups take turns, so each unit always has work (durations schematic)")]

    def blocks(y, label, items):
        o = [txt(40, y + 15, label, "cap")]
        for a, w, cls, lab in items:
            o.append(cell(X0 + a * U, y, w * U - 3, 22, cls, rx=2, label=lab))
        return "".join(o)
    b.append(blocks(72, "tensor cores", [(k * 2, 2, "s", "group 1" if k % 2 == 0 else "group 2") for k in range(4)]))
    b.append(blocks(102, "multi-function unit", [(k * 2 + 2, 1.6, "m", "group 2: e^x" if k % 2 == 0 else "group 1: e^x")
                                                  for k in range(3)]))
    b.append(blocks(132, "copy engine", [(k * 1.5, 1.3, "h", f"tile {k + 3}") for k in range(5)]))
    b.append(txt(X0, 176, "time →", "sub2"))
    body, yb = prose(214, [
        "The exponentials in softmax run on neither the tensor cores nor the ordinary CUDA cores but on a third "
        "unit, the multi-function unit, MUFU, which handles exponentials and similar functions. It is scarce: "
        f"16 results per clock per multiprocessor, about {exp_rate / 1e12:.1f} trillion a second on an H100, "
        f"against 989 trillion tensor-core operations, {H100_PEAK / exp_rate:.0f} times fewer.",
        f"Each score needs one exponential and, at head dimension {d}, {4 * d} tensor-core operations. "
        f"So the exponentials take {100 * share:.0f}% as long as the matrix multiplies: far too long to leave "
        "them waiting in line. Version 3 runs two warpgroups in pingpong: while one does its matrix "
        "multiplies, the other does its softmax on the MUFU, and then they swap. The copy engine keeps "
        "loading tiles throughout.",
        "In the paper's measurement the pingpong alone took the forward pass from 570 to 620–640 trillion "
        "operations a second.",
    ])
    figure("p21", st("one level down"), "Three units busy at once", yb + 30, b + [body],
           esc("Second overlap, one level down: not memory against arithmetic this time, but one kind of "
               "arithmetic against another. The scarcest unit sets the rhythm, and version 4 will be about "
               "exactly that unit."))


def patches():
    patch("o071", [], stamp_to=st("about 35% of peak"))
    patch("o072", [], stamp_to=st("runs asynchronously"))


if __name__ == "__main__":
    for job in (p20, n06, o073, p21, patches):
        job()
